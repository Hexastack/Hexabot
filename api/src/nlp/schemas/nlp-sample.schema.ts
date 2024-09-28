/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { ModelDefinition, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Exclude, Transform, Type } from 'class-transformer';
import { THydratedDocument, Schema as MongooseSchema } from 'mongoose';

import { Language } from '@/i18n/schemas/language.schema';
import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';
import { TFilterPopulateFields } from '@/utils/types/filter.types';

import { NlpSampleEntity } from './nlp-sample-entity.schema';
import { NlpSampleState } from './types';

@Schema({ timestamps: true })
export class NlpSampleStub extends BaseSchema {
  /**
   * The content of the sample.
   */
  @Prop({ type: String, required: true, unique: true })
  text: string;

  /**
   * Either or not this sample was used for traning already.
   */
  @Prop({ type: Boolean, default: false })
  trained?: boolean;

  /**
   * From where this sample was provided.
   */
  @Prop({
    type: String,
    enum: Object.values(NlpSampleState),
    default: NlpSampleState.train,
  })
  type?: keyof typeof NlpSampleState;

  /**
   * The language of the sample.
   */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Language',
    required: false,
  })
  language: unknown | null;
}

@Schema({ timestamps: true })
export class NlpSample extends NlpSampleStub {
  @Transform(({ obj }) => obj.language.toString())
  language: string | null;

  @Exclude()
  entities?: never;
}

@Schema({ timestamps: true })
export class NlpSampleFull extends NlpSampleStub {
  @Type(() => Language)
  language: Language | null;

  @Type(() => NlpSampleEntity)
  entities: NlpSampleEntity[];
}

export type NlpSampleDocument = THydratedDocument<NlpSample>;

export const NlpSampleModel: ModelDefinition = LifecycleHookManager.attach({
  name: NlpSample.name,
  schema: SchemaFactory.createForClass(NlpSampleStub),
});

NlpSampleModel.schema.virtual('entities', {
  ref: 'NlpSampleEntity',
  localField: '_id',
  foreignField: 'sample',
});

export default NlpSampleModel.schema;

export type NlpSamplePopulate = keyof TFilterPopulateFields<
  NlpSample,
  NlpSampleStub
>;

export const NLP_SAMPLE_POPULATE: NlpSamplePopulate[] = [
  'language',
  'entities',
];
