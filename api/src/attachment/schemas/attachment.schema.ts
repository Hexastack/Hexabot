/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ModelDefinition, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform, Type } from 'class-transformer';
import { Schema as MongooseSchema } from 'mongoose';

import { ChannelName } from '@/channel/types';
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

import {
  AttachmentAccess,
  AttachmentCreatedByRef,
  AttachmentResourceRef,
} from '../types';
import { MIME_REGEX } from '../utilities';

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
  channel?: Partial<Record<ChannelName, any>>;

  /**
   * Object ID of the createdBy (depending on the createdBy type)
   */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    refPath: 'createdByRef',
    default: null,
  })
  createdBy: unknown;

  /**
   * Type of the createdBy (depending on the createdBy type)
   */
  @Prop({ type: String, enum: Object.values(AttachmentCreatedByRef) })
  createdByRef: AttachmentCreatedByRef;

  /**
   * Resource reference of the attachment
   */
  @Prop({
    type: String,
    enum: Object.values(AttachmentResourceRef),
    index: true,
  })
  resourceRef: AttachmentResourceRef;

  /**
   * Access level of the attachment
   */
  @Prop({ type: String, enum: Object.values(AttachmentAccess) })
  access: AttachmentAccess;

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
}

@Schema({ timestamps: true })
export class Attachment extends AttachmentStub {
  @Transform(({ obj }) => obj.createdBy?.toString() || null)
  createdBy: string | null;
}

@Schema({ timestamps: true })
export class UserAttachmentFull extends AttachmentStub {
  @Type(() => User)
  createdBy: User | undefined;
}

@Schema({ timestamps: true })
export class SubscriberAttachmentFull extends AttachmentStub {
  @Type(() => Subscriber)
  createdBy: Subscriber | undefined;
}

export type AttachmentDocument = THydratedDocument<Attachment>;

export const AttachmentModel: ModelDefinition = LifecycleHookManager.attach({
  name: Attachment.name,
  schema: SchemaFactory.createForClass(Attachment),
});

AttachmentModel.schema.virtual('url').get(function () {
  if (this._id && this.name)
    return buildURL(
      config.apiBaseUrl,
      `/attachment/download/${this._id}/${this.name}`,
    );

  return '';
});

export default AttachmentModel.schema;

export type AttachmentPopulate = keyof TFilterPopulateFields<
  Attachment,
  AttachmentStub
>;

export const ATTACHMENT_POPULATE: AttachmentPopulate[] = ['createdBy'];
