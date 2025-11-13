/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import fs from 'fs';
import os from 'os';
import { join, normalize, resolve } from 'path';
import { Readable, Stream } from 'stream';

import { LoggerService } from '@hexabot/logger';
import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  StreamableFile,
} from '@nestjs/common';
import sanitizeFilename from 'sanitize-filename';

import {
  AttachmentCreateDto,
  AttachmentMetadataDto,
} from '@/attachment/dto/attachment.dto';
import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { AttachmentResourceRef } from '@/attachment/types';
import {
  fileExists,
  generateUniqueFilename,
  getStreamableFile,
} from '@/attachment/utilities';
import { config } from '@/config';
import { HelperService } from '@/helper/helper.service';
import BaseStorageHelper from '@/helper/lib/base-storage-helper';
import { SettingService } from '@/setting/services/setting.service';

import { LOCAL_STORAGE_HELPER_NAME } from './settings';

@Injectable()
export default class LocalStorageHelper
  extends BaseStorageHelper<typeof LOCAL_STORAGE_HELPER_NAME>
  implements OnModuleInit
{
  constructor(
    settingService: SettingService,
    helperService: HelperService,
    logger: LoggerService,
  ) {
    super(LOCAL_STORAGE_HELPER_NAME, settingService, helperService, logger);
  }

  getPath() {
    return __dirname;
  }

  /**
   * Get the attachment root directory given the resource reference
   *
   * @param ref The attachment resource reference
   * @returns The root directory path
   */
  private getRootDirByResourceRef(ref: AttachmentResourceRef) {
    return ref === AttachmentResourceRef.SubscriberAvatar ||
      ref === AttachmentResourceRef.UserAvatar
      ? config.parameters.avatarDir
      : config.parameters.uploadDir;
  }

  /**
   * Stores a attachment file to the local directory.
   *
   * @param file - The file
   * @param metadata - The attachment metadata informations.
   * @returns A promise that resolves to the uploaded attachment.
   */
  async store(
    file: Buffer | Stream | Readable | Express.Multer.File,
    metadata: AttachmentMetadataDto,
  ): Promise<AttachmentCreateDto> {
    const rootDir = this.getRootDirByResourceRef(metadata.resourceRef);
    const uniqueFilename = generateUniqueFilename(metadata.name);
    const filePath = resolve(join(rootDir, sanitizeFilename(uniqueFilename)));

    if (Buffer.isBuffer(file)) {
      await fs.promises.writeFile(
        filePath,
        file as unknown as NodeJS.ArrayBufferView,
      );
    } else if (file instanceof Readable || file instanceof Stream) {
      await new Promise<void>((resolve, reject) => {
        const writeStream = fs.createWriteStream(filePath);
        file.pipe(writeStream);
        // @TODO: Calc size here?
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
    } else {
      if (file.path) {
        // For example, if the file is an instance of `Express.Multer.File` (diskStorage case)
        const srcFilePath = fs.realpathSync(resolve(file.path));
        // Get the system's temporary directory in a cross-platform way
        const tempDir = os.tmpdir();
        const normalizedTempDir = normalize(tempDir);

        if (!srcFilePath.startsWith(normalizedTempDir)) {
          throw new Error('Invalid file path');
        }

        await fs.promises.copyFile(srcFilePath, filePath);
        await fs.promises.unlink(srcFilePath);
      } else {
        await fs.promises.writeFile(
          filePath,
          file.buffer as unknown as NodeJS.ArrayBufferView,
        );
      }
    }

    const location = filePath.replace(rootDir, '');

    return {
      ...metadata,
      location,
    };
  }

  /**
   * Downloads an attachment identified by the provided parameters.
   *
   * @param attachment - The attachment to download.
   * @returns A promise that resolves to a StreamableFile representing the downloaded attachment.
   */
  async download(attachment: AttachmentOrmEntity): Promise<StreamableFile> {
    const rootDir = this.getRootDirByResourceRef(attachment.resourceRef);
    const path = resolve(join(rootDir, attachment.location));

    if (!fileExists(path)) {
      throw new NotFoundException('No file was found');
    }

    const disposition = `attachment; filename="${encodeURIComponent(
      attachment.name,
    )}"`;

    return getStreamableFile({
      path,
      options: {
        type: attachment.type,
        disposition,
      },
    });
  }

  /**
   * Returns an attachment identified by the provided parameters as a Buffer.
   *
   * @param attachment - The attachment to download.
   * @returns A promise that resolves to a Buffer representing the attachment file.
   */
  async readAsBuffer(
    attachment: AttachmentOrmEntity,
  ): Promise<Buffer | undefined> {
    const path = resolve(
      join(
        this.getRootDirByResourceRef(attachment.resourceRef),
        attachment.location,
      ),
    );

    if (!fileExists(path)) {
      throw new NotFoundException('No file was found');
    }

    return await fs.promises.readFile(path); // Reads the file content as a Buffer
  }

  /**
   * Returns an attachment identified by the provided parameters as a Stream.
   *
   * @param attachment - The attachment to download.
   * @returns A promise that resolves to a Stream representing the attachment file.
   */
  async readAsStream(
    attachment: AttachmentOrmEntity,
  ): Promise<Stream | undefined> {
    const path = resolve(
      join(
        this.getRootDirByResourceRef(attachment.resourceRef),
        attachment.location,
      ),
    );

    if (!fileExists(path)) {
      throw new NotFoundException('No file was found');
    }

    return fs.createReadStream(path);
  }
}
