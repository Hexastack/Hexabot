/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Attachment } from '@hexabot-ai/types';
import { AttachmentRef } from '@hexabot-ai/types';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';
import { Request } from 'express';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { config } from '@/config';
import { LoggerService } from '@/logger/logger.service';
import { buildURL } from '@/utils/helpers/URL';

export type HasDownloadAccess = (
  attachment: Attachment,
  req: Request,
) => Promise<boolean> | boolean;

@Injectable()
export class ChannelAttachmentService {
  protected readonly jwtSignOptions: JwtSignOptions = {
    secret: config.parameters.signedUrl.secret,
    expiresIn: config.parameters.signedUrl.expiresIn,
    algorithm: 'HS256',
    encoding: 'utf-8',
  };

  constructor(
    private readonly attachmentService: AttachmentService,
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Generates a signed URL for downloading an attachment.
   *
   * @param sourceId - The source ID.
   * @param attachment - The attachment ID or object to generate a signed URL for.
   * @return A signed URL string for downloading the specified attachment.
   */
  public async getPublicUrl(
    sourceId: string,
    attachment?: AttachmentRef | AttachmentOrmEntity | null,
  ) {
    const fallbackUrl = this.buildNotFoundUrl(sourceId);
    if (!attachment || typeof attachment !== 'object') {
      this.logger.warn(
        'Unable to resolve the attachment public URL.',
        attachment as unknown,
      );

      return fallbackUrl;
    }

    const attachmentId = 'id' in attachment ? attachment.id : undefined;
    const attachmentUrl = 'url' in attachment ? attachment.url : undefined;
    if (typeof attachmentId === 'string' && attachmentId.length > 0) {
      const resource = await this.attachmentService.findOne(attachmentId);

      if (!resource) {
        this.logger.warn('Unable to find attachment sending fallback image');

        return fallbackUrl;
      }

      const token = this.jwtService.sign({ ...resource }, this.jwtSignOptions);

      return buildURL(
        config.apiBaseUrl,
        `/webhook/${sourceId}/download/${resource.name}?t=${encodeURIComponent(token)}`,
      );
    }

    if (typeof attachmentUrl === 'string' && attachmentUrl.length > 0) {
      // In case the url is external
      return attachmentUrl;
    }

    if ('id' in attachment && !attachment.id) {
      this.logger.warn('Unable to build public URL: Empty attachment ID');

      return fallbackUrl;
    }

    this.logger.warn(
      'Unable to resolve the attachment public URL.',
      attachment as unknown,
    );

    return fallbackUrl;
  }

  /**
   * Downloads an attachment using a signed token.
   *
   * @param token The signed token used to verify and locate the attachment.
   * @param req - The HTTP express request object.
   * @param hasDownloadAccess - Callback used to verify the attachment access.
   * @return A streamable file of the attachment.
   */
  public async download(
    token: string,
    req: Request,
    hasDownloadAccess: HasDownloadAccess,
  ): Promise<StreamableFile> {
    try {
      const {
        exp: _exp,
        iat: _iat,
        ...result
      } = this.jwtService.verify(
        token,
        this.jwtSignOptions as JwtVerifyOptions,
      );
      const attachment: Attachment = result;
      const canDownload = await hasDownloadAccess(attachment, req);

      if (!canDownload) {
        throw new ForbiddenException(
          'You are not authorized to download the attachment',
        );
      }

      return await this.attachmentService.download(attachment);
    } catch (err) {
      this.logger.error('Failed to download attachment', err);
      throw new NotFoundException('Unable to locate attachment');
    }
  }

  private buildNotFoundUrl(sourceId: string): string {
    return buildURL(config.apiBaseUrl, `/webhook/${sourceId}/not-found`);
  }
}
