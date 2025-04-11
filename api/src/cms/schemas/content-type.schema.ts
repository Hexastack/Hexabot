/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ModelDefinition, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

import { FieldType } from '@/setting/schemas/types';
import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';

import { ContentField } from '../dto/contentType.dto';

@Schema({ timestamps: true })
export class ContentType extends BaseSchema {
  /**
   * The name the content type.
   */
  @Prop({ type: String, required: true, unique: true })
  name: string;

  /**
   * The way this type is defined and is presented.
   */

  @Prop({
    type: mongoose.Schema.Types.Mixed,
    default: [
      {
        name: 'title',
        label: 'Title',
        type: FieldType.text,
      },
      {
        name: 'status',
        label: 'Status',
        type: FieldType.checkbox,
      },
    ],
  })
  fields: ContentField[];
}

export const ContentTypeModel: ModelDefinition = LifecycleHookManager.attach({
  name: ContentType.name,
  schema: SchemaFactory.createForClass(ContentType),
});

export default ContentTypeModel.schema;
