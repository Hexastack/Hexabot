/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ModelDefinition, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform, Type } from 'class-transformer';
import { Schema as MongooseSchema } from 'mongoose';

import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';
import {
  TFilterPopulateFields,
  THydratedDocument,
} from '@/utils/types/filter.types';

import { NlpExperiment } from './nlp-experiment.schema';
import { NlpParameter } from './nlp-parameter.schema';

@Schema({ timestamps: true })
export class NlpParameterValueStub extends BaseSchema {
  @Prop({ type: String, required: false, unique: false })
  foreign_id?: string;

  @Prop({ type: Number, required: true })
  value: number;

  @Prop({ type: Number, required: true })
  version: number;

  /**
   * Parameter associated with the Parameter Value
   */
  @Prop({
    type: String,
    ref: 'NlpParameter',
    required: true,
  })
  parameter: unknown;

  /**
   * Experiment associated with the Parameter Value
   */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'NlpExperiment',
  })
  experiment: unknown;

  @Prop({
    type: String,
    unique: false,
    required: true,
    index: true,
  })
  model: string;
}

@Schema({ timestamps: true })
export class NlpParameterValue extends NlpParameterValueStub {
  @Transform(({ obj }) => obj.experiment.toString())
  experiment: string;

  @Transform(({ obj }) => obj.parameter.toString())
  parameter: string;
}

@Schema({ timestamps: true })
export class NlpParameterValueFull extends NlpParameterValueStub {
  @Type(() => NlpExperiment)
  experiment: NlpExperiment;

  @Type(() => NlpParameter)
  parameter: NlpParameter;
}

export type NlpParameterValueDocument = THydratedDocument<NlpParameterValue>;

export const NlpParameterValueModel: ModelDefinition =
  LifecycleHookManager.attach({
    name: NlpParameterValue.name,
    schema: SchemaFactory.createForClass(NlpParameterValueStub),
  });
NlpParameterValueModel.schema.index(
  { parameter: 1, value: 1 },
  { unique: false },
);

export default NlpParameterValueModel.schema;

export type NlpParameterValuePopulate = keyof TFilterPopulateFields<
  NlpParameterValue,
  NlpParameterValueStub
>;

export const NLP_PARAMETER_VALUE_POPULATE: NlpParameterValuePopulate[] = [
  'experiment',
  'parameter',
];
