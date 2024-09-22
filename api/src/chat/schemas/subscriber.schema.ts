/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Prop, Schema, SchemaFactory, ModelDefinition } from '@nestjs/mongoose';
import { Transform, Type } from 'class-transformer';
import { THydratedDocument, Schema as MongooseSchema } from 'mongoose';

import { Attachment } from '@/attachment/schemas/attachment.schema';
import { User } from '@/user/schemas/user.schema';
import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';
import { TFilterPopulateFields } from '@/utils/types/filter.types';

import { Label } from './label.schema';
import { ChannelData } from './types/channel';

@Schema({ timestamps: true })
export class SubscriberStub extends BaseSchema {
  @Prop({
    type: String,
    required: true,
  })
  first_name: string;

  @Prop({
    type: String,
    required: true,
  })
  last_name: string;

  @Prop({
    type: String,
  })
  locale: string;

  @Prop({
    type: Number,
    default: 0,
  })
  timezone?: number;

  @Prop({
    type: String,
  })
  language: string;

  @Prop({
    type: String,
  })
  gender: string;

  @Prop({
    type: String,
  })
  country: string;

  @Prop({
    type: String,
  })
  foreign_id: string;

  @Prop([
    { type: MongooseSchema.Types.ObjectId, required: false, ref: 'Label' },
  ])
  labels: unknown;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: false,
    ref: 'User',
    default: null,
  })
  assignedTo?: unknown;

  @Prop({
    type: Date,
    default: null,
  })
  assignedAt?: Date;

  @Prop({
    type: Date,
    default: () => Date.now() + 7 * 24 * 60 * 60 * 1000,
  })
  lastvisit?: Date;

  @Prop({
    type: Date,
    default: () => Date.now() + 7 * 24 * 60 * 60 * 1000,
  })
  retainedFrom?: Date;

  @Prop({
    type: Object,
  })
  channel: ChannelData;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Attachment',
    default: null,
  })
  avatar?: unknown;
}

@Schema({ timestamps: true })
export class Subscriber extends SubscriberStub {
  @Transform(({ obj }) => obj.labels.map((label) => label.toString()))
  labels: string[];

  @Transform(({ obj }) => (obj.assignedTo ? obj.assignedTo.toString() : null))
  assignedTo?: string;

  @Transform(({ obj }) => obj.avatar?.toString() || null)
  avatar?: string;
}

@Schema({ timestamps: true })
export class SubscriberFull extends SubscriberStub {
  @Type(() => Label)
  labels: Label[];

  @Type(() => User)
  assignedTo?: User | null;

  @Type(() => Attachment)
  avatar: Attachment | null;
}

export type SubscriberDocument = THydratedDocument<Subscriber>;

export const SubscriberModel: ModelDefinition = LifecycleHookManager.attach({
  name: Subscriber.name,
  schema: SchemaFactory.createForClass(SubscriberStub),
});

export default SubscriberModel.schema;

export type SubscriberPopulate = keyof TFilterPopulateFields<
  Subscriber,
  SubscriberStub
>;

export const SUBSCRIBER_POPULATE: SubscriberPopulate[] = [
  'labels',
  'assignedTo',
  'avatar',
];
