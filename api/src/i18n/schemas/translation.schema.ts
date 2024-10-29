/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
