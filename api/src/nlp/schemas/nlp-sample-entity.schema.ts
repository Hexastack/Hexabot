/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Prop, Schema, SchemaFactory, ModelDefinition } from '@nestjs/mongoose';
import { Transform, Type } from 'class-transformer';
import { THydratedDocument, Schema as MongooseSchema } from 'mongoose';

import { BaseSchema } from '@/utils/generics/base-schema';
import { TFilterPopulateFields } from '@/utils/types/filter.types';

import { NlpEntity } from './nlp-entity.schema';
import { NlpSample } from './nlp-sample.schema';
import { NlpValue } from './nlp-value.schema';

@Schema({ timestamps: true })
export class NlpSampleEntityStub extends BaseSchema {
  /**
   * The index indicating the start of the text to be used for the training.
   */
  @Prop({ type: Number })
  start?: number;

  /**
   * The index marking the end of the text to be used for the training.
   */
  @Prop({ type: Number })
  end?: number;

  /**
   * The nlp entity involved for this training.
   */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'NlpEntity',
    required: true,
  })
  entity: unknown;

  /**
   * The value of the above nlp entity.
   */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'NlpValue',
    required: true,
  })
  value: unknown;

  /**
   * The sample of the training (text).
   */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'NlpSample',
    required: true,
  })
  sample: unknown;
}

@Schema({ timestamps: true })
export class NlpSampleEntity extends NlpSampleEntityStub {
  @Transform(({ obj }) => (obj.start > -1 ? obj.start : undefined))
  start?: number;

  @Transform(({ obj }) => (obj.end > -1 ? obj.end : undefined))
  end?: number;

  @Transform(({ obj }) => obj.entity.toString())
  entity: string;

  @Transform(({ obj }) => obj.value.toString())
  value: string;

  @Transform(({ obj }) => obj.sample.toString())
  sample: string;
}

@Schema({ timestamps: true })
export class NlpSampleEntityFull extends NlpSampleEntityStub {
  @Transform(({ obj }) => (obj.start > -1 ? obj.start : undefined))
  start?: number;

  @Transform(({ obj }) => (obj.end > -1 ? obj.end : undefined))
  end?: number;

  @Type(() => NlpEntity)
  entity: NlpEntity;

  @Type(() => NlpValue)
  value: NlpValue;

  @Type(() => NlpSample)
  sample: NlpSample;
}

export type NlpSampleEntityDocument = THydratedDocument<NlpSampleEntity>;

export const NlpSampleEntityModel: ModelDefinition = {
  name: NlpSampleEntity.name,
  schema: SchemaFactory.createForClass(NlpSampleEntityStub),
};

export default NlpSampleEntityModel.schema;

export type NlpSampleEntityPopulate = keyof TFilterPopulateFields<
  NlpSampleEntity,
  NlpSampleEntityStub
>;

export const NLP_SAMPLE_ENTITY_POPULATE: NlpSampleEntityPopulate[] = [
  'entity',
  'value',
  'sample',
];
