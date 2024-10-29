/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ModelDefinition, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Exclude, Type } from 'class-transformer';

import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';
import {
  TFilterPopulateFields,
  THydratedDocument,
} from '@/utils/types/filter.types';

import { TRelation } from '../types/index.type';

import { Permission } from './permission.schema';

@Schema({ timestamps: true })
export class ModelStub extends BaseSchema {
  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  name: string;

  @Prop({
    type: String,
    required: true,
  })
  identity: string;

  @Prop({
    type: Object,
    default: {},
  })
  attributes: object;

  @Prop({
    type: String,
    //TODO: need to be updated
    default: 'role',
  })
  relation?: TRelation;
}

@Schema({ timestamps: true })
export class Model extends ModelStub {
  @Exclude()
  permissions?: never;
}

@Schema({ timestamps: true })
export class ModelFull extends ModelStub {
  @Type(() => Permission)
  permissions: Permission[];
}

export type ModelDocument = THydratedDocument<Model>;

export const ModelModel: ModelDefinition = LifecycleHookManager.attach({
  name: Model.name,
  schema: SchemaFactory.createForClass(ModelStub),
});

ModelModel.schema.virtual('permissions', {
  ref: 'Permission',
  localField: '_id',
  foreignField: 'model',
});

export default ModelModel.schema;

export type ModelPopulate = keyof TFilterPopulateFields<Model, ModelStub>;

export const MODEL_POPULATE: ModelPopulate[] = ['permissions'];
