/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Readable, Stream } from 'stream';

import { Injectable, StreamableFile } from '@nestjs/common';

import { HelperService } from '@/helper/helper.service';
import { HelperType } from '@/helper/types';
import { BaseService } from '@/utils/generics/base-service';

import { AttachmentMetadataDto } from '../dto/attachment.dto';
import { AttachmentRepository } from '../repositories/attachment.repository';
import { Attachment } from '../schemas/attachment.schema';

@Injectable()
export class AttachmentService extends BaseService<Attachment> {
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
  ): Promise<Attachment> {
    const storageHelper = await this.helperService.getDefaultHelper(
      HelperType.STORAGE,
    );
    const dto = await storageHelper.store(file, metadata);
    return await this.create(dto);
  }

  /**
   * Downloads the specified attachment using the default storage helper.
   *
   * @param The attachment object containing the metadata required for the download.
   * @returns A promise resolving to a `StreamableFile` instance of the downloaded attachment.
   */
  async download(attachment: Attachment): Promise<StreamableFile> {
    const storageHelper = await this.helperService.getDefaultHelper(
      HelperType.STORAGE,
    );
    return await storageHelper.download(attachment);
  }

  /**
   * Reads the specified attachment as a buffer using the default storage helper.
   *
   * @param attachment - The attachment object containing the metadata required to locate the file.
   * @returns A promise resolving to the file content as a `Buffer`, or `undefined` if the file cannot be read.
   */
  async readAsBuffer(attachment: Attachment): Promise<Buffer | undefined> {
    const storageHelper = await this.helperService.getDefaultHelper(
      HelperType.STORAGE,
    );
    return await storageHelper.readAsBuffer(attachment);
  }

  /**
   * Reads the specified attachment as a stream using the default storage helper.
   *
   * @param attachment - The attachment object containing the metadata required to locate the file.
   * @returns A promise resolving to the file content as a `Stream`, or `undefined` if the file cannot be read.
   */
  async readAsStream(attachment: Attachment): Promise<Stream | undefined> {
    const storageHelper = await this.helperService.getDefaultHelper(
      HelperType.STORAGE,
    );
    return await storageHelper.readAsStream(attachment);
  }
}
