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

import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';
import { TFilterPopulateFields } from '@/utils/types/filter.types';

import { Subscriber } from './subscriber.schema';
import { StdIncomingMessage, StdOutgoingMessage } from './types/message';

@Schema({ timestamps: true })
export class MessageStub extends BaseSchema {
  @Prop({
    type: String,
    required: false,
    //TODO : add default value for mid
  })
  mid?: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: false,
    ref: 'Subscriber',
  })
  sender?: unknown;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: false,
    ref: 'Subscriber',
  })
  recipient?: unknown;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: false,
    ref: 'User',
  })
  sentBy?: unknown;

  @Prop({
    type: Object,
    required: true,
  })
  message: StdOutgoingMessage | StdIncomingMessage;

  @Prop({
    type: Boolean,
    default: false,
  })
  read?: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  delivery?: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  handover?: boolean;
}

@Schema({ timestamps: true })
export class Message extends MessageStub {
  @Transform(({ obj }) => obj.sender?.toString())
  sender?: string;

  @Transform(({ obj }) => obj.recipient?.toString())
  recipient?: string;

  @Transform(({ obj }) => obj.sentBy?.toString())
  sentBy?: string;
}

@Schema({ timestamps: true })
export class MessageFull extends MessageStub {
  @Type(() => Subscriber)
  sender?: Subscriber;

  @Type(() => Subscriber)
  recipient?: Subscriber;

  @Transform(({ obj }) => obj.sentBy?.toString())
  sentBy?: string; // sendBy is never populate
}

export const MessageModel: ModelDefinition = LifecycleHookManager.attach({
  name: Message.name,
  schema: SchemaFactory.createForClass(MessageStub),
});

export default MessageModel.schema;

export type MessagePopulate = keyof TFilterPopulateFields<Message, MessageStub>;

export const MESSAGE_POPULATE: MessagePopulate[] = ['sender', 'recipient'];
