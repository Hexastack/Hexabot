/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
