/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ModelDefinition, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Exclude, Transform, Type } from 'class-transformer';
import { Schema as MongooseSchema } from 'mongoose';

import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';
import {
  TFilterPopulateFields,
  THydratedDocument,
} from '@/utils/types/filter.types';

import { Message } from './message.schema';
import { Subscriber } from './subscriber.schema';

@Schema({ timestamps: true })
export class ThreadStub extends BaseSchema {
  @Prop({
    type: String,
    unique: true,
    required: true,
  })
  title: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: false,
    ref: 'Subscriber',
  })
  subscriber?: unknown;
}

@Schema({ timestamps: true })
export class Thread extends ThreadStub {
  @Transform(({ obj }) => obj.subscriber?.toString())
  subscriber: string;

  @Exclude()
  messages?: never;
}

@Schema({ timestamps: true })
export class ThreadFull extends ThreadStub {
  @Type(() => Subscriber)
  subscriber: Subscriber;

  @Type(() => Message)
  messages?: Message[];
}

export type ThreadDocument = THydratedDocument<Thread>;

export const ThreadModel: ModelDefinition = LifecycleHookManager.attach({
  name: Thread.name,
  schema: SchemaFactory.createForClass(ThreadStub),
});

ThreadModel.schema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'thread',
  justOne: false,
});

export default ThreadModel.schema;

export type ThreadPopulate = keyof TFilterPopulateFields<Thread, ThreadStub>;

export const THREAD_POPULATE: ThreadPopulate[] = ['messages', 'subscriber'];
