/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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

import { Context } from '../types/context';
import { Block } from './block.schema';
import { Subscriber } from './subscriber.schema';

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
