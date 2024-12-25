/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ModelDefinition, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform, Type } from 'class-transformer';
import { Schema as MongooseSchema } from 'mongoose';

import { Subscriber } from '@/chat/schemas/subscriber.schema';
import { FileType } from '@/chat/schemas/types/attachment';
import { config } from '@/config';
import { User } from '@/user/schemas/user.schema';
import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';
import { buildURL } from '@/utils/helpers/URL';
import {
  TFilterPopulateFields,
  THydratedDocument,
} from '@/utils/types/filter.types';

import { MIME_REGEX } from '../utilities';

/**
 * Defines the types of owners for an attachment,
 * indicating whether the file belongs to a User or a Subscriber.
 */
export type TAttachmentOwnerType = 'User' | 'Subscriber';

/**
 * Defines the various contexts in which an attachment can exist.
 * These contexts influence how the attachment is uploaded, stored, and accessed:
 */
export type TAttachmentContextType =
  | 'setting_attachment' // Attachments related to app settings, restricted to users with specific permissions.
  | 'user_avatar' // Avatar files for users, only the current user can upload, accessible to those with appropriate permissions.
  | 'subscriber_avatar' // Avatar files for subscribers, uploaded programmatically, accessible to authorized users.
  | 'block_attachment' // Files sent by the bot, public or private based on the channel and user authentication.
  | 'content_attachment' // Files in the knowledge base, usually public but could vary based on specific needs.
  | 'message_attachment'; // Files sent or received via messages, uploaded programmatically, accessible to users with inbox permissions.;

@Schema({ timestamps: true })
export class AttachmentStub extends BaseSchema {
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
      config.apiBaseUrl,
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

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    refPath: 'ownerType',
    default: null,
  })
  owner?: unknown;

  @Prop({ type: String })
  ownerType?: TAttachmentOwnerType;

  @Prop({ type: String })
  context?: TAttachmentContextType;
}

@Schema({ timestamps: true })
export class Attachment extends AttachmentStub {
  @Transform(({ obj }) => obj.owner?.toString() || null)
  owner?: string | null;
}

@Schema({ timestamps: true })
export class AttachmentUserFull extends AttachmentStub {
  @Type(() => User)
  owner: User | null;
}

@Schema({ timestamps: true })
export class AttachmentSubscriberFull extends AttachmentStub {
  @Type(() => Subscriber)
  owner: Subscriber | null;
}

export type AttachmentDocument = THydratedDocument<Attachment>;

export const AttachmentModel: ModelDefinition = LifecycleHookManager.attach({
  name: Attachment.name,
  schema: SchemaFactory.createForClass(Attachment),
});

AttachmentModel.schema.virtual('url').get(function () {
  if (this._id && this.name) {
    return buildURL(
      config.apiBaseUrl,
      `/attachment/download/${this._id}/${this.name}`,
    );
  }
  return '';
});

export default AttachmentModel.schema;

export type AttachmentPopulate = keyof TFilterPopulateFields<
  Attachment,
  AttachmentStub
>;

export const ATTACHMENT_POPULATE: AttachmentPopulate[] = ['owner'];
