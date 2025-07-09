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

import { Attachment } from '@/attachment/schemas/attachment.schema';
import { ChannelName } from '@/channel/types';
import { User } from '@/user/schemas/user.schema';
import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';
import {
  TFilterPopulateFields,
  THydratedDocument,
} from '@/utils/types/filter.types';

import { Label } from './label.schema';
import { SubscriberChannelData } from './types/channel';
import { SubscriberContext } from './types/subscriberContext';

@Schema({ timestamps: true })
export class SubscriberStub extends BaseSchema {
  @Prop({
    type: String,
    required: true,
    index: true,
  })
  first_name: string;

  @Prop({
    type: String,
    required: true,
    index: true,
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
    index: true,
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
  assignedTo: unknown;

  @Prop({
    type: Date,
    default: null,
  })
  assignedAt: Date | null;

  @Prop({
    type: Date,
    default: () => Date.now(),
    index: true,
  })
  lastvisit?: Date;

  @Prop({
    type: Date,
    default: () => Date.now(),
  })
  retainedFrom?: Date;

  @Prop({
    type: Object,
  })
  channel: SubscriberChannelData;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Attachment',
    default: null,
  })
  avatar: unknown;

  @Prop({
    type: Object,
    default: { vars: {} },
  })
  context: SubscriberContext;

  static getChannelData<
    C extends ChannelName,
    S extends SubscriberStub = Subscriber,
  >(subscriber: S) {
    return subscriber.channel as SubscriberChannelData<C>;
  }
}

@Schema({ timestamps: true })
export class Subscriber extends SubscriberStub {
  @Transform(({ obj }) => obj.labels.map((label) => label.toString()))
  labels: string[];

  @Transform(({ obj }) => obj.assignedTo?.toString() || null)
  assignedTo: string | null;

  @Transform(({ obj }) => obj.avatar?.toString() || null)
  avatar: string | null;
}

@Schema({ timestamps: true })
export class SubscriberFull extends SubscriberStub {
  @Type(() => Label)
  labels: Label[];

  @Type(() => User)
  assignedTo: User | null;

  @Type(() => Attachment)
  avatar: Attachment | null;
}

export type SubscriberDocument = THydratedDocument<Subscriber>;

export const SubscriberModel: ModelDefinition = LifecycleHookManager.attach({
  name: Subscriber.name,
  schema: SchemaFactory.createForClass(SubscriberStub).index({
    first_name: 1,
    last_name: 1,
  }),
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
