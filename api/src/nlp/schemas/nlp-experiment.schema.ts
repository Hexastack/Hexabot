/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ModelDefinition, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform, Type } from 'class-transformer';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';
import { TFilterPopulateFields } from '@/utils/types/filter.types';

import { NlpMetrics } from './nlp-metrics.schema';
import { NlpModel } from './nlp-model.schema';
import { NlpParameters } from './nlp-parameters.schema';

@Schema({ timestamps: true })
export class NlpExperimentStub extends BaseSchema {
  @Prop({ type: String, required: false, unique: false })
  foreign_id?: string;

  @Prop({ type: String, required: false })
  run_name?: string;

  @Prop({ type: Number, required: true })
  current_version: string;

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
    type: MongooseSchema.Types.ObjectId,
    ref: 'NlpModel',
    required: true,
  })
  model: unknown;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'NlpMetrics',
    required: true,
  })
  metrics: unknown;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'NlpParameters',
    required: true,
  })
  parameters: unknown;

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
  @Transform(({ obj }) => obj.model.toString())
  model: string;

  @Transform(({ obj }) => obj.metrics.toString())
  metrics: string;

  @Transform(({ obj }) => obj.parameters.toString())
  parameters: string;
}

@Schema({ timestamps: true })
export class NlpExperimentFull extends NlpExperimentStub {
  @Type(() => NlpModel)
  model: NlpModel;

  @Type(() => NlpMetrics)
  metrics: NlpMetrics;

  @Type(() => NlpParameters)
  parameters: NlpParameters;
}

export type NlpExperimentDocument = HydratedDocument<NlpExperiment>;

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
  'model',
  'parameters',
  'metrics',
];
