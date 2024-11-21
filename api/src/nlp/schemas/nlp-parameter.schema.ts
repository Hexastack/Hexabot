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
export class NlpParameterStub extends BaseSchema {
  @Prop({ type: String, required: false, unique: false })
  foreign_id?: string;

  @Prop({ type: String, required: true, unique: true, index: true })
  name: string;

  /**
   * A list of experiments associated with this model.
   */
  @Prop([
    {
      type: MongooseSchema.Types.ObjectId,
      ref: 'NlpExperiment',
    },
  ])
  experiments: unknown;
}

@Schema({ timestamps: true })
export class NlpParameter extends NlpParameterStub {
  @Transform(({ obj }) => obj.experiments.map((elem) => elem.toString()))
  experiments: string[];
}

@Schema({ timestamps: true })
export class NlpParameterFull extends NlpParameterStub {
  @Type(() => NlpExperiment)
  experiment: NlpExperiment[];
}

export type NlpParameterDocument = THydratedDocument<NlpParameter>;

export const NlpParameterModel: ModelDefinition = LifecycleHookManager.attach({
  name: NlpParameter.name,
  schema: SchemaFactory.createForClass(NlpParameterStub),
});

export default NlpParameterModel.schema;

export type NlpParameterPopulate = keyof TFilterPopulateFields<
  NlpParameter,
  NlpParameterStub
>;

export const NLP_PARAMETERS_POPULATE: NlpParameterPopulate[] = ['experiments'];
