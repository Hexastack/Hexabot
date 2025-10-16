/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Readable, Stream } from 'stream';

import { Injectable, StreamableFile } from '@nestjs/common';

import { Attachment as AttachmentEntity } from '@/attachment/entities/attachment.entity';
import { Attachment as AttachmentSchema } from '@/attachment/schemas/attachment.schema';
import { HelperService } from '@/helper/helper.service';
import { HelperType } from '@/helper/types';
import { BaseOrmService } from '@/utils/generics/base-orm.service';

import { AttachmentMetadataDto } from '../dto/attachment.dto';
import { AttachmentRepository } from '../repositories/attachment.repository';

type AttachmentLike = AttachmentEntity | AttachmentSchema;

@Injectable()
export class AttachmentService extends BaseOrmService<
  AttachmentEntity,
  AttachmentRepository
> {
  constructor(
    readonly repository: AttachmentRepository,
    private readonly helperService: HelperService,
  ) {
    super(repository);
  }

  /**
   * Stores a file using the default storage helper and creates an attachment record.
   *
   * This method retrieves the default storage helper via the `HelperService` and
   * delegates the file storage operation to it. The returned metadata is then used
   * to create a new `Attachment` record in the database.
   *
   * @param file - The file to be stored. This can be a buffer, a stream, a readable, or a file from an Express Multer upload.
   * @param metadata - The metadata associated with the file, such as name, size, and type.
   * @returns A promise resolving to the created `Attachment` record.
   */
  async store(
    file: Buffer | Stream | Readable | Express.Multer.File,
    metadata: AttachmentMetadataDto,
  ): Promise<AttachmentEntity> {
    const storageHelper = await this.helperService.getDefaultHelper(
      HelperType.STORAGE,
    );
    const dto = await storageHelper.store(file, metadata);
    return await this.create(dto);
  }

  /**
   * Downloads the specified attachment using the default storage helper.
   *
   * @param attachment - The attachment object containing the metadata required for the download.
   * @returns A promise resolving to a `StreamableFile` instance of the downloaded attachment.
   */
  async download(attachment: AttachmentLike): Promise<StreamableFile> {
    const storageHelper = await this.helperService.getDefaultHelper(
      HelperType.STORAGE,
    );
    return await storageHelper.download(this.toEntity(attachment));
  }

  /**
   * Reads the specified attachment as a buffer using the default storage helper.
   *
   * @param attachment - The attachment object containing the metadata required to locate the file.
   * @returns A promise resolving to the file content as a `Buffer`, or `undefined` if the file cannot be read.
   */
  async readAsBuffer(
    attachment: AttachmentLike,
  ): Promise<Buffer | undefined> {
    const storageHelper = await this.helperService.getDefaultHelper(
      HelperType.STORAGE,
    );
    return await storageHelper.readAsBuffer(this.toEntity(attachment));
  }

  /**
   * Reads the specified attachment as a stream using the default storage helper.
   *
   * @param attachment - The attachment object containing the metadata required to locate the file.
   * @returns A promise resolving to the file content as a `Stream`, or `undefined` if the file cannot be read.
   */
  async readAsStream(
    attachment: AttachmentLike,
  ): Promise<Stream | undefined> {
    const storageHelper = await this.helperService.getDefaultHelper(
      HelperType.STORAGE,
    );
    return await storageHelper.readAsStream(this.toEntity(attachment));
  }

  private toEntity(attachment: AttachmentLike): AttachmentEntity {
    if (attachment instanceof AttachmentEntity) {
      return attachment;
    }

    const entity = new AttachmentEntity();
    Object.assign(entity, {
      id: (attachment as AttachmentSchema & { id?: string }).id ??
        (attachment as any)?._id?.toString(),
      name: attachment.name,
      type: attachment.type,
      size: attachment.size,
      location: attachment.location,
      channel: attachment.channel,
      createdBy: (attachment as any).createdBy ?? null,
      createdByRef: attachment.createdByRef,
      resourceRef: attachment.resourceRef,
      access: attachment.access,
      createdAt: attachment.createdAt,
      updatedAt: attachment.updatedAt,
    });

    return entity;
  }
}
