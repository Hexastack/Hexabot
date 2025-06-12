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

import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';
import {
  TFilterPopulateFields,
  THydratedDocument,
} from '@/utils/types/filter.types';

import { getDefaultConversationContext } from '../constants/conversation';

import { Block } from './block.schema';
import { Subscriber } from './subscriber.schema';
import { Context } from './types/context';

@Schema({ timestamps: true, minimize: false })
class ConversationStub extends BaseSchema {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    ref: 'Subscriber',
  })
  sender: unknown;

  @Prop({
    type: Boolean,
    default: true,
  })
  active: boolean;

  @Prop({
    type: Object,
    default: getDefaultConversationContext(),
  })
  context: Context;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Block',
  })
  current: unknown;

  @Prop([
    {
      type: MongooseSchema.Types.ObjectId,
      ref: 'Block',
      default: [],
    },
  ])
  next: unknown;
}

@Schema({ timestamps: true })
export class Conversation extends ConversationStub {
  @Transform(({ obj }) => obj.sender.toString())
  sender: string;

  @Transform(({ obj }) => (obj.current ? obj.current.toString() : null))
  current: string | null;

  @Transform(({ obj }) => obj.next.map((elem) => elem.toString()))
  next: string[];
}

@Schema({ timestamps: true })
export class ConversationFull extends ConversationStub {
  @Type(() => Subscriber)
  sender: Subscriber;

  @Type(() => Block)
  current: Block;

  @Type(() => Block)
  next: Block[];
}

export type ConversationDocument = THydratedDocument<Conversation>;

export const ConversationModel: ModelDefinition = LifecycleHookManager.attach({
  name: Conversation.name,
  schema: SchemaFactory.createForClass(ConversationStub),
});

export default ConversationModel.schema;

export type ConversationPopulate = keyof TFilterPopulateFields<
  Conversation,
  ConversationStub
>;

export const CONVERSATION_POPULATE: ConversationPopulate[] = [
  'sender',
  'current',
  'next',
];
