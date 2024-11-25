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

@Schema({ timestamps: true })
export class NlpDatasetStub extends BaseSchema {
  @Prop({ type: String, required: false, unique: false })
  foreign_id?: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Number, required: true })
  current_version: number;

  /**
   * Metadata associated with this Dataset, which may include additional information
   * such as configurations, parameters, or system-generated details.
   */
  @Prop({ type: JSON, default: {} })
  metadata?: Record<string, any>;

  /**
   * A list of tags associated with the Dataset for better categorization.
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

  /**
   * A list of experiments associated with this dataset.
   */
  @Prop({
    type: [MongooseSchema.Types.ObjectId],
    ref: 'NlpExperiment',
    default: [],
    required: true,
  })
  experiments: unknown;
}

@Schema({ timestamps: true })
export class NlpDataset extends NlpDatasetStub {
  @Transform(({ obj }) => obj.experiments.map((elem) => elem.toString()))
  experiments: string[];
}

@Schema({ timestamps: true })
export class NlpDatasetFull extends NlpDatasetStub {
  @Type(() => NlpExperiment)
  experiments: NlpExperiment[];
}

export type NlpDatasetDocument = THydratedDocument<NlpDataset>;

export const NlpDatasetModel: ModelDefinition = LifecycleHookManager.attach({
  name: NlpDataset.name,
  schema: SchemaFactory.createForClass(NlpDatasetStub),
});

export default NlpDatasetModel.schema;

export type NlpDatasetPopulate = keyof TFilterPopulateFields<
  NlpDataset,
  NlpDatasetStub
>;

export const NLP_DATASET_POPULATE: NlpDatasetPopulate[] = ['experiments'];
