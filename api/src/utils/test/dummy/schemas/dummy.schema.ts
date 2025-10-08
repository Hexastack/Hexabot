/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';
import { THydratedDocument } from '@/utils/types/filter.types';

@Schema({ timestamps: true })
export class Dummy extends BaseSchema {
  @Prop({
    type: String,
    required: true,
  })
  dummy: string;

  @Prop({
    type: Object,
  })
  dynamicField?: Record<string, any> | undefined;
}

export type DummyDocument = THydratedDocument<Dummy>;

export const DummyModel = LifecycleHookManager.attach({
  name: Dummy.name,
  schema: SchemaFactory.createForClass(Dummy),
});
