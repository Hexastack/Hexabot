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
export class LabelGroup extends BaseSchema {
  @Prop({
    type: String,
    unique: true,
    required: true,
  })
  name: string;
}

export type LabelGroupDocument = THydratedDocument<LabelGroup>;

export const LabelGroupModel: ModelDefinition = LifecycleHookManager.attach({
  name: LabelGroup.name,
  schema: SchemaFactory.createForClass(LabelGroup),
});

export default LabelGroupModel.schema;
