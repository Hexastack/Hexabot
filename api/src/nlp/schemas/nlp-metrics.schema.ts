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
import { NlpModel } from './nlp-model.schema';

@Schema({ timestamps: true })
export class NlpMetricsStub extends BaseSchema {
  @Prop({ type: String, required: false, unique: false })
  foreign_id?: string;

  @Prop({ type: Number, required: false })
  accuracy: number;

  @Prop({ type: Number, required: false })
  val_accuracy: number;

  @Prop({ type: Number, required: false })
  precision: number;

  @Prop({ type: Number, required: false })
  val_precision: number;

  @Prop({ type: Number, required: false })
  recall: number;

  @Prop({ type: Number, required: false })
  val_recall: number;

  @Prop({ type: Number, required: false })
  f1score: number;

  @Prop({ type: Number, required: false })
  val_f1score: number;

  /**
   * The associated Experiment
   */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'NlpExperiment',
    required: true,
  })
  experiment: unknown;

  /**
   * The associated Model
   */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'NlpModel',
    required: true,
  })
  model: unknown;
}

@Schema({ timestamps: true })
export class NlpMetrics extends NlpMetricsStub {
  @Transform(({ obj }) => obj.model.toString())
  model: string;

  @Transform(({ obj }) => obj.experiment.toString())
  experiment: string;
}

@Schema({ timestamps: true })
export class NlpMetricsFull extends NlpMetricsStub {
  @Type(() => NlpModel)
  model: NlpModel;

  @Type(() => NlpExperiment)
  experiment: NlpExperiment;
}

export type NlpMetricsDocument = THydratedDocument<NlpMetrics>;

export const NlpMetricsModel: ModelDefinition = {
  name: NlpMetrics.name,
  schema: SchemaFactory.createForClass(NlpMetricsStub),
};

NlpMetricsModel.schema.virtual('experiment', {
  ref: 'NlpMetrics',
  localField: '_id',
  foreignField: 'metrics',
});

export default NlpMetricsModel.schema;

export type NlpMetricsPopulate = keyof TFilterPopulateFields<
  NlpMetrics,
  NlpMetricsStub
>;

export const NLP_METRICS_POPULATE: NlpMetricsPopulate[] = [
  'model',
  'experiment',
];
