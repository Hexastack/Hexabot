/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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

import { LabelGroup } from './label-group.schema';
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
    type: MongooseSchema.Types.ObjectId,
    required: false,
    ref: 'LabelGroup',
  })
  group: unknown; // When provided, any labels sharing the same value are mutually exclusive (only one allowed at a time).

  @Prop({
    type: Object,
  })
  label_id?: Record<string, any>; // Indexed by channel name

  @Prop({
    type: String,
  })
  description: string;

  @Prop({
    type: Boolean,
    default: false,
  })
  builtin: boolean;
}

@Schema({ timestamps: true })
export class Label extends LabelStub {
  @Exclude()
  users?: never;

  @Transform(({ obj }) => obj.group?.toString() || null)
  group: string | null;
}

@Schema({ timestamps: true })
export class LabelFull extends LabelStub {
  @Type(() => Subscriber)
  users?: Subscriber[];

  @Type(() => LabelGroup)
  group: LabelGroup | null;
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

export const LABEL_POPULATE: LabelPopulate[] = ['users', 'group'];
