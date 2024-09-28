/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { ModelDefinition, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { THydratedDocument } from 'mongoose';

import { FileType } from '@/chat/schemas/types/attachment';
import { config } from '@/config';
import { BaseSchema } from '@/utils/generics/base-schema';
import { buildURL } from '@/utils/helpers/URL';

import { MIME_REGEX } from '../utilities';

// TODO: Interface AttachmentAttrs declared, currently not used

export interface AttachmentAttrs {
  name: string;
  type: string;
  size: number;
  location: string;
  channel?: Record<string, any>;
}

@Schema({ timestamps: true })
export class Attachment extends BaseSchema {
  /**
   * The name of the attachment.
   */
  @Prop({
    type: String,
    required: true,
  })
  name: string;

  /**
   * The MIME type of the attachment, must match the MIME_REGEX.
   */
  @Prop({
    type: String,
    required: true,
    match: MIME_REGEX,
  })
  type: string;

  /**
   * The size of the attachment in bytes, must be between 0 and config.parameters.maxUploadSize.
   */
  @Prop({
    type: Number,
    required: true,
    min: 0,
    max: config.parameters.maxUploadSize,
  })
  size: number;

  /**
   * The location of the attachment, must be a unique value and pass the fileExists validation.
   */
  @Prop({
    type: String,
    unique: true,
  })
  location: string;

  /**
   * Optional property representing the attachment channel, can hold a partial record of various channel data.
   */
  @Prop({ type: JSON })
  channel?: Partial<Record<string, any>>;

  /**
   * Optional property representing the URL of the attachment.
   *
   */
  url?: string;

  /**
   * Generates and returns the URL of the attachment.
   * @param attachmentId - Id of the attachment
   * @param attachmentName - The file name of the attachment. Optional and defaults to an empty string.
   * @returns A string representing the attachment URL
   */
  static getAttachmentUrl(
    attachmentId: string,
    attachmentName: string = '',
  ): string {
    return buildURL(
      config.parameters.apiUrl,
      `/attachment/download/${attachmentId}/${attachmentName}`,
    );
  }

  /**
   * Determines the type of the attachment based on its MIME type.
   * @param mimeType - The MIME Type of the attachment (eg. image/png)
   * @returns The attachment type ('image', 'audio', 'video' or 'file')
   */
  static getTypeByMime(mimeType: string): FileType {
    if (mimeType.startsWith(FileType.image)) {
      return FileType.image;
    } else if (mimeType.startsWith(FileType.audio)) {
      return FileType.audio;
    } else if (mimeType.startsWith(FileType.video)) {
      return FileType.video;
    } else {
      return FileType.file;
    }
  }
}

export type AttachmentDocument = THydratedDocument<Attachment>;

export const AttachmentModel: ModelDefinition = {
  name: Attachment.name,
  schema: SchemaFactory.createForClass(Attachment),
};

AttachmentModel.schema.virtual('url').get(function () {
  if (this._id && this.name)
    return buildURL(
      config.apiPath,
      `/attachment/download/${this._id}/${this.name}`,
    );

  return '';
});

export default AttachmentModel.schema;
