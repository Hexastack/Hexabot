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
import { NlpMetric } from './nlp-metric.schema';

@Schema({ timestamps: true })
export class NlpMetricValueStub extends BaseSchema {
  @Prop({ type: String, required: false, unique: false })
  foreign_id?: string;

  @Prop({ type: Number, required: true })
  value: number;

  @Prop({ type: Number, required: true })
  version: number;

  /**
   * Metric name associated with the Metric Value
   */
  @Prop({
    type: String, // Store the name of the metric as a string
    required: true,
    ref: 'NlpMetric', // Logical reference to the NlpMetric collection
  })
  metric: unknown;

  /**
   * Experiment associated with the Metric Value
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
export class NlpMetricValue extends NlpMetricValueStub {
  @Transform(({ obj }) => obj.experiment.toString())
  experiment: string;

  @Transform(({ obj }) => obj.metric.toString())
  metric: string;
}

@Schema({ timestamps: true })
export class NlpMetricValueFull extends NlpMetricValueStub {
  @Type(() => NlpExperiment)
  experiment: NlpExperiment;

  @Type(() => NlpMetric)
  metric: NlpMetric;
}

export type NlpMetricValueDocument = THydratedDocument<NlpMetricValue>;

export const NlpMetricValueModel: ModelDefinition = LifecycleHookManager.attach(
  {
    name: NlpMetricValue.name,
    schema: SchemaFactory.createForClass(NlpMetricValueStub),
  },
);

NlpMetricValueModel.schema.index({ metric: 1, value: 1 }, { unique: false });

export default NlpMetricValueModel.schema;

export type NlpMetricValuePopulate = keyof TFilterPopulateFields<
  NlpMetricValue,
  NlpMetricValueStub
>;

export const NLP_METRIC_VALUE_POPULATE: NlpMetricValuePopulate[] = [
  'experiment',
  'metric',
];
