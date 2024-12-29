/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import fs, { createReadStream, promises as fsPromises } from 'fs';
import path, { join } from 'path';
import { Readable } from 'stream';

import {
  Injectable,
  NotFoundException,
  Optional,
  StreamableFile,
} from '@nestjs/common';
import fetch from 'node-fetch';
import sanitizeFilename from 'sanitize-filename';

import { config } from '@/config';
import { LoggerService } from '@/logger/logger.service';
import { PluginInstance } from '@/plugins/map-types';
import { PluginService } from '@/plugins/plugins.service';
import { PluginType } from '@/plugins/types';
import { BaseService } from '@/utils/generics/base-service';

import { AttachmentMetadataDto } from '../dto/attachment.dto';
import { AttachmentRepository } from '../repositories/attachment.repository';
import { Attachment } from '../schemas/attachment.schema';
import {
  fileExists,
  generateUniqueFilename,
  getStreamableFile,
} from '../utilities';

@Injectable()
export class AttachmentService extends BaseService<Attachment> {
  private storagePlugin: PluginInstance<PluginType.storage> | null = null;

  constructor(
    readonly repository: AttachmentRepository,
    private readonly logger: LoggerService,
    @Optional() private readonly pluginService: PluginService,
  ) {
    super(repository);
  }

  /**
   * A storage plugin is a alternative way to store files, instead of local filesystem, you can
   * have a plugin that would store files in a 3rd party system (Minio, AWS S3, ...)
   *
   * @param foreign_id The unique identifier of the user, used to locate the profile picture.
   * @returns A singleton instance of the storage plugin
   */
  getStoragePlugin() {
    if (!this.storagePlugin) {
      const plugins = this.pluginService.getAllByType(PluginType.storage);

      if (plugins.length === 1) {
        this.storagePlugin = plugins[0];
      } else if (plugins.length > 1) {
        throw new Error(
          'Multiple storage plugins are detected, please ensure only one is available',
        );
      }
    }

    return this.storagePlugin;
  }

  /**
   * Downloads a user's profile picture either from a 3rd party storage system or from a local directory based on configuration.
   *
   * @param foreign_id The unique identifier of the user, used to locate the profile picture.
   * @returns A `StreamableFile` containing the user's profile picture.
   */
  async downloadProfilePic(foreign_id: string): Promise<StreamableFile> {
    if (this.getStoragePlugin()) {
      try {
        const pict = foreign_id + '.jpeg';
        const picture = await this.getStoragePlugin().downloadProfilePic(pict);
        return picture;
      } catch (err) {
        this.logger.error('Error downloading profile picture', err);
        throw new NotFoundException('Profile picture not found');
      }
    } else {
      const path = join(config.parameters.avatarDir, `${foreign_id}.jpeg`);
      if (fs.existsSync(path)) {
        const picturetream = createReadStream(path);
        return new StreamableFile(picturetream);
      } else {
        throw new NotFoundException('Profile picture not found');
      }
    }
  }

  /**
   * Uploads a profile picture to either 3rd party storage system or locally based on the configuration.
   *
   * @param res - The response object from which the profile picture will be buffered or piped.
   * @param filename - The filename
   */
  async uploadProfilePic(data: Buffer | fetch.Response, filename: string) {
    if (this.getStoragePlugin()) {
      // Upload profile picture
      const picture = {
        originalname: filename,
        buffer: Buffer.isBuffer(data) ? data : await data.buffer(),
      } as Express.Multer.File;
      try {
        await this.getStoragePlugin().uploadAvatar(picture);
        this.logger.log(
          `Profile picture uploaded successfully to ${
            this.getStoragePlugin().name
          }`,
        );
      } catch (err) {
        this.logger.error(
          `Error while uploading profile picture to ${
            this.getStoragePlugin().name
          }`,
          err,
        );
      }
    } else {
      // Save profile picture locally
      const dirPath = path.join(config.parameters.avatarDir, filename);

      try {
        // Ensure the directory exists
        await fs.promises.mkdir(config.parameters.avatarDir, {
          recursive: true,
        });

        if (Buffer.isBuffer(data)) {
          await fs.promises.writeFile(dirPath, data);
        } else {
          const dest = fs.createWriteStream(dirPath);
          data.body.pipe(dest);
        }
        this.logger.debug(
          'Messenger Channel Handler : Profile picture fetched successfully',
        );
      } catch (err) {
        this.logger.error(
          'Messenger Channel Handler : Error while creating directory',
          err,
        );
      }
    }
  }

  /**
   * Uploads files to the server. If a storage plugin is configured it uploads files accordingly.
   * Otherwise, uploads files to the local directory.
   *
   * @param files - An array of files to upload.
   * @returns A promise that resolves to an array of uploaded attachments.
   */
  async uploadFiles(files: { file: Express.Multer.File[] }) {
    const uploadedFiles: Attachment[] = [];

    if (this.getStoragePlugin()) {
      for (const file of files?.file) {
        const dto = await this.getStoragePlugin().upload(file);
        const uploadedFile = await this.create(dto);
        uploadedFiles.push(uploadedFile);
      }
    } else {
      if (Array.isArray(files?.file)) {
        for (const { size, mimetype, filename } of files?.file) {
          const uploadedFile = await this.create({
            size,
            type: mimetype,
            name: filename,
            channel: {},
            location: `/${filename}`,
          });
          uploadedFiles.push(uploadedFile);
        }
      }
    }

    return uploadedFiles;
  }

  /**
   * Uploads files to the server. If a storage plugin is configured it uploads files accordingly.
   * Otherwise, uploads files to the local directory.
   *
   * @param file - The file
   * @returns A promise that resolves to an array of uploaded attachments.
   */
  async store(
    file: Buffer | Readable | Express.Multer.File,
    metadata: AttachmentMetadataDto,
  ): Promise<Attachment> {
    if (this.getStoragePlugin()) {
      const storedDto = await this.getStoragePlugin().store(file, metadata);
      return await this.create(storedDto);
    } else {
      const dirPath = path.join(config.parameters.uploadDir);
      const uniqueFilename = generateUniqueFilename(metadata.name);
      const filePath = path.resolve(dirPath, sanitizeFilename(uniqueFilename));

      if (!filePath.startsWith(dirPath)) {
        throw new Error('Invalid file path');
      }

      if (Buffer.isBuffer(file)) {
        await fsPromises.writeFile(filePath, file);
      } else if (file instanceof Readable) {
        await new Promise((resolve, reject) => {
          const writeStream = fs.createWriteStream(filePath);
          file.pipe(writeStream);
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });
      } else {
        if (file.path) {
          // For example, if the file is an instance of `Express.Multer.File` (diskStorage case)
          const srcFilePath = path.resolve(file.path);
          await fsPromises.copyFile(srcFilePath, filePath);
          await fsPromises.unlink(srcFilePath);
        } else {
          await fsPromises.writeFile(filePath, file.buffer);
        }
      }

      const location = filePath.replace(dirPath, '');
      return await this.create({
        ...metadata,
        location,
      });
    }
  }

  /**
   * Downloads an attachment identified by the provided parameters.
   *
   * @param  attachment - The attachment to download.
   * @returns A promise that resolves to a StreamableFile representing the downloaded attachment.
   */
  async download(attachment: Attachment) {
    if (this.getStoragePlugin()) {
      return await this.getStoragePlugin().download(attachment);
    } else {
      if (!fileExists(attachment.location)) {
        throw new NotFoundException('No file was found');
      }

      const path = join(config.parameters.uploadDir, attachment.location);

      const disposition = `attachment; filename="${encodeURIComponent(
        attachment.name,
      )}"`;

      return getStreamableFile({
        path,
        options: {
          type: attachment.type,
          length: attachment.size,
          disposition,
        },
      });
    }
  }

  /**
   * Downloads an attachment identified by the provided parameters as a Buffer.
   *
   * @param  attachment - The attachment to download.
   * @returns A promise that resolves to a Buffer representing the downloaded attachment.
   */
  async readAsBuffer(attachment: Attachment): Promise<Buffer> {
    if (this.getStoragePlugin()) {
      return await this.getStoragePlugin().readAsBuffer(attachment);
    } else {
      if (!fileExists(attachment.location)) {
        throw new NotFoundException('No file was found');
      }
      const filePath = join(config.parameters.uploadDir, attachment.location);
      return await fs.promises.readFile(filePath); // Reads the file content as a Buffer
    }
  }
}
