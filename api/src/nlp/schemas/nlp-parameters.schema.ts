/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ModelDefinition, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform, Type } from 'class-transformer';
import { Schema as MongooseSchema, THydratedDocument } from 'mongoose';

import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';
import { TFilterPopulateFields } from '@/utils/types/filter.types';

import { NlpExperiment } from './nlp-experiment.schema';

@Schema({ timestamps: true })
export class NlpParametersStub extends BaseSchema {
  @Prop({ type: String, required: false, unique: false })
  foreign_id?: string;

  @Prop({ type: JSON, default: {} })
  parameters?: Record<string, any>;

  /**
   * A list of experiments associated with this model.
   */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'NlpExperiment',
    required: true,
  })
  experiment: unknown;
}

@Schema({ timestamps: true })
export class NlpParameters extends NlpParametersStub {
  @Transform(({ obj }) => obj.experiment.toString())
  experiment: string;
}

@Schema({ timestamps: true })
export class NlpParametersFull extends NlpParametersStub {
  @Type(() => NlpExperiment)
  experiment: NlpExperiment;
}

export type NlpParametersDocument = THydratedDocument<NlpParameters>;

export const NlpParametersModel: ModelDefinition = LifecycleHookManager.attach({
  name: NlpParameters.name,
  schema: SchemaFactory.createForClass(NlpParametersStub),
});

NlpParametersModel.schema.virtual('experiment', {
  ref: 'NlpParameters',
  localField: '_id',
  foreignField: 'parameters',
});

export default NlpParametersModel.schema;

export type NlpParametersPopulate = keyof TFilterPopulateFields<
  NlpParameters,
  NlpParametersStub
>;

export const NLP_PARAMETERS_POPULATE: NlpParametersPopulate[] = ['experiment'];
