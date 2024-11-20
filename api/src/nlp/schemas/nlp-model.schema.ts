/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ModelDefinition, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import { Schema as MongooseSchema } from 'mongoose';

import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';
import {
  TFilterPopulateFields,
  THydratedDocument,
} from '@/utils/types/filter.types';

import { NlpExperiment } from './nlp-experiment.schema';

@Schema({ timestamps: true })
export class NlpModelStub extends BaseSchema {
  @Prop({ type: String, required: false, unique: false })
  foreign_id?: string;

  @Prop({ type: String, required: true, unique: true })
  name: string;

  @Prop({ type: Number, required: true })
  version: number;

  @Prop({ type: String, required: true })
  uri: string;

  /**
   * Metadata are additional data that can be associated to this values, most of the time, the metadata contains system values or ids (e.g: value: "coffee", metadata: "item_11") .
   */
  @Prop({ type: JSON, default: {} })
  metadata?: Record<string, any>;

  /**
   * Indicates whether the model is active or deprecated.
   */
  @Prop({ type: Boolean, default: true, required: true })
  isActive: boolean;

  /**
   * A list of experiments associated with this model.
   */
  @Prop({
    type: [MongooseSchema.Types.ObjectId],
    ref: 'NlpExperiment',
    default: [],
    required: true,
  })
  experiments: unknown[];

  /**
   * Retrieves all models from the provided array of models that are marked as active.
   * @param models - Array of models
   * @returns {NlpModelStub[]} - Array containing active models
   */
  static getActiveModels<T extends NlpModelStub>(models: T[]): T[] {
    return models.filter((model) => model.isActive);
  }

  /**
   * Converts an array of models into a map object.
   * @param models - Array of models
   * @returns {Record<string, T>} - Object where the key is the model's name and the value is the model
   */
  static getModelMap<T extends NlpModelStub>(models: T[]): Record<string, T> {
    return models.reduce(
      (acc, curr) => {
        acc[curr.name] = curr;
        return acc;
      },
      {} as Record<string, T>,
    );
  }
}

@Schema({ timestamps: true })
export class NlpModel extends NlpModelStub {}

@Schema({ timestamps: true })
export class NlpModelFull extends NlpModelStub {
  @Type(() => NlpExperiment)
  experiments: NlpExperiment[];
}

export type NlpModelDocument = THydratedDocument<NlpModel>;

export const NlpModelModel: ModelDefinition = LifecycleHookManager.attach({
  name: NlpModel.name,
  schema: SchemaFactory.createForClass(NlpModelStub),
});

NlpModelModel.schema.virtual('experiments', {
  ref: 'NlpExperiment',
  localField: '_id',
  foreignField: 'model',
});

export default NlpModelModel.schema;

export type NlpModelPopulate = keyof TFilterPopulateFields<
  NlpModel,
  NlpModelStub
>;

export const NLP_MODEL_POPULATE: NlpModelPopulate[] = []['experiments'];
