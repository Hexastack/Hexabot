/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
