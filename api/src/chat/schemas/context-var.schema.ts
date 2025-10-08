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
export class ContextVar extends BaseSchema {
  @Prop({
    type: String,
    unique: true,
    required: true,
  })
  label: string;

  @Prop({
    type: String,
    unique: true,
    required: true,
    match: /^[a-z_0-9]+$/,
  })
  name: string;

  /**
   * The permanent attribute allows the chatbot to know where to store the context variable.
   * If the context variable is not permanent, it will be stored in the converation context, which is temporary.
   * If the context variable is permanent, it will be stored in the subscriber context, which is permanent.
   */
  @Prop({
    type: Boolean,
    default: false,
  })
  permanent: boolean;
}

export const ContextVarModel: ModelDefinition = LifecycleHookManager.attach({
  name: ContextVar.name,
  schema: SchemaFactory.createForClass(ContextVar),
});

export type ContextVarDocument = THydratedDocument<ContextVar>;

export default ContextVarModel.schema;
