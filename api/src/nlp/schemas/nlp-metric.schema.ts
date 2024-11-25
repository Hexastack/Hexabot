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
import {
  TFilterPopulateFields,
  THydratedDocument,
} from '@/utils/types/filter.types';

import { NlpExperiment } from './nlp-experiment.schema';

@Schema({ timestamps: true })
export class NlpMetricStub extends BaseSchema {
  @Prop({ type: String, required: false, unique: false })
  foreign_id?: string;

  @Prop({ type: String, required: true, unique: true, index: true })
  name: string;

  /**
   * The associated Experiment
   */
  @Prop([
    {
      type: MongooseSchema.Types.ObjectId,
      ref: 'NlpExperiment',
    },
  ])
  experiments: unknown;

  /**
   * The associated Models
   */
  @Prop([
    {
      type: String,
      required: true,
      unique: false,
      index: true,
    },
  ])
  models: string[];
}

@Schema({ timestamps: true })
export class NlpMetric extends NlpMetricStub {
  @Transform(({ obj }) => obj.experiments.map((elem) => elem.toString()))
  experiments: string[];
}

@Schema({ timestamps: true })
export class NlpMetricFull extends NlpMetricStub {
  @Type(() => NlpExperiment)
  experiments: NlpExperiment[];
}

export type NlpMetricDocument = THydratedDocument<NlpMetric>;

export const NlpMetricModel: ModelDefinition = {
  name: NlpMetric.name,
  schema: SchemaFactory.createForClass(NlpMetricStub),
};

export default NlpMetricModel.schema;

export type NlpMetricPopulate = keyof TFilterPopulateFields<
  NlpMetric,
  NlpMetricStub
>;

export const NLP_METRIC_POPULATE: NlpMetricPopulate[] = ['experiments'];
