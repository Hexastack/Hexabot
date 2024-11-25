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

import { NlpDataset } from './nlp-dataset.schema';
import { NlpMetricValue } from './nlp-metric-value.schema';
import { NlpParameterValue } from './nlp-parameter-value.schema';

@Schema({ timestamps: true })
export class NlpExperimentStub extends BaseSchema {
  @Prop({ type: String, required: false, unique: false })
  foreign_id?: string;

  @Prop({ type: String, required: false })
  run_name?: string;

  @Prop({ type: Number, required: true })
  current_version: number;

  /**
   * The duration of the experiment in seconds, stored as a floating-point number.
   */
  @Prop({ type: Number, required: true })
  duration: number;

  /**
   * Metadata associated with this experiment, which may include additional information
   * such as configurations, parameters, or system-generated details.
   */
  @Prop({ type: JSON, default: {} })
  metadata?: Record<string, any>;

  /**
   * Indicates whether this experiment is marked as completed or still in progress.
   */
  @Prop({ type: Boolean, default: false, required: true })
  isCompleted: boolean;

  /**
   * A list of tags associated with the experiment for better categorization.
   */
  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({
    type: String,
    unique: false,
    required: true,
    index: true,
  })
  model: string;

  @Prop({
    type: [
      {
        metric: { type: String, required: true }, // Metric name
        value: { type: Number, required: true }, // Metric value
      },
    ],
    required: true,
  })
  metrics: unknown;

  @Prop({
    type: [
      {
        parameter: { type: String, required: true }, // Parameter name
        value: { type: Number, required: true }, // Parameter value
      },
    ],
    required: true,
  })
  parameters: unknown;

  /**
   * A list of datasets associated with this experiment.
   */
  @Prop({
    type: [MongooseSchema.Types.ObjectId],
    ref: 'NlpDataset',
    default: [],
    required: true,
  })
  datasets: unknown;

  /**
   * Retrieves all completed experiments from the provided array.
   * @param experiments - Array of experiments
   * @returns {NlpExperimentStub[]} - Array containing completed experiments
   */
  static getCompletedExperiments<T extends NlpExperimentStub>(
    experiments: T[],
  ): T[] {
    return experiments.filter((experiment) => experiment.isCompleted);
  }

  /**
   * Converts an array of experiments into a map object.
   * @param experiments - Array of experiments
   * @returns {Record<string, T>} - Object where the key is the `foreign_id` and the value is the experiment
   */
  static getExperimentMap<T extends NlpExperimentStub>(
    experiments: T[],
  ): Record<string, T> {
    return experiments.reduce(
      (acc, curr) => {
        if (curr.foreign_id) acc[curr.foreign_id] = curr;
        return acc;
      },
      {} as Record<string, T>,
    );
  }
}

@Schema({ timestamps: true })
export class NlpExperiment extends NlpExperimentStub {
  @Transform(({ obj }) => obj.metrics.map((elem) => JSON.stringify(elem)))
  metrics: string[];

  @Transform(({ obj }) => obj.parameters.map((elem) => JSON.stringify(elem)))
  parameters: string[];

  @Transform(({ obj }) => obj.datasets.map((elem) => elem.toString()))
  datasets: string[];
}

@Schema({ timestamps: true })
export class NlpExperimentFull extends NlpExperimentStub {
  @Type(() => NlpMetricValue)
  metrics: NlpMetricValue[];

  @Type(() => NlpParameterValue)
  parameters: NlpParameterValue[];

  @Type(() => NlpDataset)
  datasets: NlpDataset[];
}

export type NlpExperimentDocument = THydratedDocument<NlpExperiment>;

export const NlpExperimentModel: ModelDefinition = LifecycleHookManager.attach({
  name: NlpExperiment.name,
  schema: SchemaFactory.createForClass(NlpExperimentStub),
});

export default NlpExperimentModel.schema;

export type NlpExperimentPopulate = keyof TFilterPopulateFields<
  NlpExperiment,
  NlpExperimentStub
>;

export const NLP_EXPERIMENT_POPULATE: NlpExperimentPopulate[] = [
  'parameters',
  'metrics',
  'datasets',
];
