/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import fs, { createReadStream } from 'fs';
import path, { join } from 'path';

import {
  Injectable,
  NotFoundException,
  Optional,
  StreamableFile,
} from '@nestjs/common';
import fetch from 'node-fetch';

import { config } from '@/config';
import { LoggerService } from '@/logger/logger.service';
import { PluginInstance } from '@/plugins/map-types';
import { PluginService } from '@/plugins/plugins.service';
import { PluginType } from '@/plugins/types';
import { BaseService } from '@/utils/generics/base-service';

import { AttachmentRepository } from '../repositories/attachment.repository';
import { Attachment } from '../schemas/attachment.schema';
import { fileExists, getStreamableFile } from '../utilities';

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
  async uploadProfilePic(res: fetch.Response, filename: string) {
    if (this.getStoragePlugin()) {
      // Upload profile picture
      const buffer = await res.buffer();
      const picture = {
        originalname: filename,
        buffer,
      } as Express.Multer.File;
      try {
        await this.getStoragePlugin().uploadAvatar(picture);
        this.logger.log(
          `Profile picture uploaded successfully to ${
            this.getStoragePlugin().id
          }`,
        );
      } catch (err) {
        this.logger.error(
          `Error while uploading profile picture to ${
            this.getStoragePlugin().id
          }`,
          err,
        );
      }
    } else {
      // Save profile picture locally
      const dirPath = path.join(config.parameters.avatarDir, filename);
      try {
        await fs.promises.mkdir(config.parameters.avatarDir, {
          recursive: true,
        }); // Ensure the directory exists
        const dest = fs.createWriteStream(dirPath);
        res.body.pipe(dest);
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
    if (this.getStoragePlugin()) {
      const dtos = await Promise.all(
        files.file.map((file) => {
          return this.getStoragePlugin().upload(file);
        }),
      );
      const uploadedFiles = await Promise.all(
        dtos.map((dto) => {
          return this.create(dto);
        }),
      );
      return uploadedFiles;
    } else {
      if (Array.isArray(files?.file)) {
        const uploadedFiles = await Promise.all(
          files?.file?.map(async ({ size, filename, mimetype }) => {
            return await this.create({
              size,
              type: mimetype,
              name: filename,
              channel: {},
              location: `/${filename}`,
            });
          }),
        );
        return uploadedFiles;
      }
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
}
