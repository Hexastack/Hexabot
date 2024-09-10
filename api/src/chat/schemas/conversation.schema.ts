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

import { BaseSchema } from '@/utils/generics/base-schema';

import { Block } from './block.schema';
import { Subscriber } from './subscriber.schema';
import { Context } from './types/context';

export function getDefaultConversationContext(): Context {
  return {
    vars: {}, // Used for capturing vars from user entries
    user: {
      first_name: '',
      last_name: '',
    } as Subscriber,
    user_location: {
      // Used for capturing geolocation from QR
      lat: 0.0,
      lon: 0.0,
    },
    skip: {}, // Used for list pagination
    attempt: 0, // Used to track fallback max attempts
  };
}

@Schema({ timestamps: true })
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
  active?: boolean;

  @Prop({
    type: Object,
    default: getDefaultConversationContext(),
  })
  context?: Context;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Block',
  })
  current?: unknown;

  @Prop([
    {
      type: MongooseSchema.Types.ObjectId,
      ref: 'Block',
      default: [],
    },
  ])
  next?: unknown;
}

@Schema({ timestamps: true })
export class Conversation extends ConversationStub {
  @Transform(({ obj }) => obj.sender.toString())
  sender: string;

  @Transform(({ obj }) => obj.current.toString())
  current?: string;

  @Transform(({ obj }) => obj.next.map((elem) => elem.toString()))
  next?: string[];
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

export const ConversationModel: ModelDefinition = {
  name: Conversation.name,
  schema: SchemaFactory.createForClass(ConversationStub),
};

export default ConversationModel.schema;
