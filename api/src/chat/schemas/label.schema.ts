/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Prop, Schema, SchemaFactory, ModelDefinition } from '@nestjs/mongoose';
import { Exclude, Type } from 'class-transformer';
import { THydratedDocument } from 'mongoose';

import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';
import { TFilterPopulateFields } from '@/utils/types/filter.types';

import { Subscriber } from './subscriber.schema';

@Schema({ timestamps: true })
export class LabelStub extends BaseSchema {
  @Prop({
    type: String,
    unique: true,
    required: true,
  })
  title: string;

  @Prop({
    type: String,
    unique: true,
    required: true,
    match: /^[A-Z_0-9]+$/,
  })
  name: string;

  @Prop({
    type: Object,
  })
  label_id?: Record<string, any>; // Indexed by channel name

  @Prop({
    type: String,
  })
  description?: string;

  @Prop({
    type: Boolean,
    default: false,
  })
  builtin?: boolean;
}

@Schema({ timestamps: true })
export class Label extends LabelStub {
  @Exclude()
  users?: never;
}

@Schema({ timestamps: true })
export class LabelFull extends LabelStub {
  @Type(() => Subscriber)
  users?: Subscriber[];
}

export type LabelDocument = THydratedDocument<Label>;

export const LabelModel: ModelDefinition = LifecycleHookManager.attach({
  name: Label.name,
  schema: SchemaFactory.createForClass(LabelStub),
});

LabelModel.schema.virtual('users', {
  ref: 'Subscriber',
  localField: '_id',
  foreignField: 'labels',
  justOne: false,
});

export default LabelModel.schema;

export type LabelPopulate = keyof TFilterPopulateFields<Label, LabelStub>;

export const LABEL_POPULATE: LabelPopulate[] = ['users'];
