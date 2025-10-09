/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ModelDefinition, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { FieldType } from '@/setting/schemas/types';
import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';

import { ContentField } from '../dto/contentType.dto';
import { validateUniqueFields } from '../utilities/field-validation.utils';

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
    type: [ContentField],
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
    required: true,
    validate: {
      /**
       * Ensures every `label` in the fields array is unique.
       * Runs on `save`, `create`, `insertMany`, and `findOneAndUpdate`
       * when `runValidators: true` is set.
       */
      validator(fields: ContentField[]): boolean {
        return validateUniqueFields(fields, 'label');
      },
      message:
        'Each element in "fields" must have a unique "label" (duplicate detected)',
    },
  })
  fields: ContentField[];
}

export const ContentTypeModel: ModelDefinition = LifecycleHookManager.attach({
  name: ContentType.name,
  schema: SchemaFactory.createForClass(ContentType),
});

export default ContentTypeModel.schema;
