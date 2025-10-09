/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ModelDefinition, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';

@Schema({ timestamps: true })
export class Metadata extends BaseSchema {
  @Prop({ type: String, required: true, unique: true })
  name: string;

  @Prop({ type: JSON, required: true })
  value: any;
}

export const MetadataSchema = SchemaFactory.createForClass(Metadata);

export const MetadataModel: ModelDefinition = LifecycleHookManager.attach({
  name: Metadata.name,
  schema: SchemaFactory.createForClass(Metadata),
});

export type MetadataDocument = Metadata & Document;
