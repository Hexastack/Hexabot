/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Prop, Schema, SchemaFactory, ModelDefinition } from '@nestjs/mongoose';
import { THydratedDocument } from 'mongoose';

import { BaseSchema } from '@/utils/generics/base-schema';

@Schema({ timestamps: true })
export class Language extends BaseSchema {
  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  title: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  code: string;

  @Prop({
    type: Boolean,
    default: false,
  })
  isDefault?: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  isRTL?: boolean;
}

export const LanguageModel: ModelDefinition = {
  name: Language.name,
  schema: SchemaFactory.createForClass(Language),
};

export type LanguageDocument = THydratedDocument<Language>;

export default LanguageModel.schema;
