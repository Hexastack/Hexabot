/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ModelDefinition, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';
import { THydratedDocument } from '@/utils/types/filter.types';

@Schema({ timestamps: true })
export class Translation extends BaseSchema {
  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  str: string;

  @Prop({
    type: Object,
    required: true,
  })
  translations: Record<string, string>;
}

export const TranslationModel: ModelDefinition = LifecycleHookManager.attach({
  name: Translation.name,
  schema: SchemaFactory.createForClass(Translation),
});

export type TranslationDocument = THydratedDocument<Translation>;

export default TranslationModel.schema;
