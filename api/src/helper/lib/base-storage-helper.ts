/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Readable, Stream } from 'stream';

import { StreamableFile } from '@nestjs/common';

import {
  AttachmentCreateDto,
  AttachmentMetadataDto,
} from '@/attachment/dto/attachment.dto';
import { Attachment } from '@/attachment/schemas/attachment.schema';
import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';

import { HelperService } from '../helper.service';
import { HelperName, HelperType } from '../types';

import BaseHelper from './base-helper';

export default abstract class BaseStorageHelper<
  N extends HelperName = HelperName,
> extends BaseHelper<N> {
  protected readonly type: HelperType = HelperType.STORAGE;

  constructor(
    name: N,
    settingService: SettingService,
    helperService: HelperService,
    logger: LoggerService,
  ) {
    super(name, settingService, helperService, logger);
  }

  /**
   * Uploads files to the server. If a storage helper is configured it uploads files accordingly.
   * Otherwise, uploads files to the local directory.
   *
   * @param file - The file
   * @param metadata - The attachment metadata informations.
   * @returns A promise that resolves to an array of uploaded attachments.
   */
  abstract store(
    _file: Buffer | Stream | Readable | Express.Multer.File,
    _metadata: AttachmentMetadataDto,
  ): Promise<AttachmentCreateDto>;

  /**
   * Downloads an attachment identified by the provided parameters.
   *
   * @param attachment - The attachment to download.
   * @returns A promise that resolves to a StreamableFile representing the downloaded attachment.
   */
  abstract download(attachment: Attachment): Promise<StreamableFile>;

  /**
   * Downloads an attachment identified by the provided parameters as a Buffer.
   *
   * @param attachment - The attachment to download.
   * @returns A promise that resolves to a Buffer representing the attachment file.
   */
  abstract readAsBuffer(attachment: Attachment): Promise<Buffer | undefined>;

  /**
   * Returns an attachment identified by the provided parameters as a Stream.
   *
   * @param attachment - The attachment to download.
   * @returns A promise that resolves to a Stream representing the attachment file.
   */
  abstract readAsStream(attachment: Attachment): Promise<Stream | undefined>;
}
