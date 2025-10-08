/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { ModelDefinition, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';
import { THydratedDocument } from '@/utils/types/filter.types';

@Schema({ timestamps: true })
export class Category extends BaseSchema {
  @Prop({
    type: String,
    unique: true,
    required: true,
  })
  label: string;

  @Prop({
    type: Boolean,
    default: false,
  })
  builtin: boolean;

  @Prop({
    type: Number,
    default: 100,
  })
  zoom: number;

  @Prop({
    type: [Number, Number],
    default: [0, 0],
  })
  offset: [number, number];
}

export const CategoryModel: ModelDefinition = LifecycleHookManager.attach({
  name: Category.name,
  schema: SchemaFactory.createForClass(Category),
});

export type CategoryDocument = THydratedDocument<Category>;

export default CategoryModel.schema;
