/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Attachment } from '@hexabot-ai/types';
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
import { AttachmentRef } from '@/chat/types/attachment';
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
   * @param channelName - The channel name.
   * @param attachment - The attachment ID or object to generate a signed URL for.
   * @return A signed URL string for downloading the specified attachment.
   */
  public async getPublicUrl(
    channelName: string,
    attachment: AttachmentRef | AttachmentOrmEntity,
  ) {
    const fallbackUrl = this.buildNotFoundUrl(channelName);

    if (attachment && 'id' in attachment) {
      if (!attachment.id) {
        this.logger.warn('Unable to build public URL: Empty attachment ID');

        return fallbackUrl;
      }

      const resource = await this.attachmentService.findOne(attachment.id);

      if (!resource) {
        this.logger.warn('Unable to find attachment sending fallback image');

        return fallbackUrl;
      }

      const token = this.jwtService.sign({ ...resource }, this.jwtSignOptions);

      return buildURL(
        config.apiBaseUrl,
        `/webhook/${channelName}/download/${resource.name}?t=${encodeURIComponent(token)}`,
      );
    }

    if ('url' in attachment && attachment.url) {
      // In case the url is external
      return attachment.url;
    }

    this.logger.warn(
      'Unable to resolve the attachment public URL.',
      attachment,
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

  private buildNotFoundUrl(channelName: string): string {
    return buildURL(config.apiBaseUrl, `/webhook/${channelName}/not-found`);
  }
}
