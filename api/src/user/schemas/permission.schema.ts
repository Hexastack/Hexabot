/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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

import { Action } from '../types/action.type';
import { TRelation } from '../types/index.type';

import { Model } from './model.schema';
import { Role } from './role.schema';

@Schema({ timestamps: true })
export class PermissionStub extends BaseSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: 'Model' })
  model: unknown;

  @Prop({
    type: String,
    required: true,
    enum: Action,
  })
  action: Action;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: 'Role' })
  role: unknown;

  @Prop({
    type: String,
    default: 'role',
  })
  relation: TRelation;
}

@Schema({ timestamps: true })
export class Permission extends PermissionStub {
  @Transform(({ obj }) => obj.model.toString())
  model: string;

  @Transform(({ obj }) => obj.role.toString())
  role: string;
}

@Schema({ timestamps: true })
export class PermissionFull extends PermissionStub {
  @Type(() => Model)
  model: Model;

  @Type(() => Role)
  role: Role;
}

export type PermissionDocument = THydratedDocument<Permission>;

export const PermissionModel: ModelDefinition = LifecycleHookManager.attach({
  name: Permission.name,
  schema: SchemaFactory.createForClass(PermissionStub).index(
    { model: 1, action: 1, role: 1, relation: 1 },
    { unique: true },
  ),
});

export default PermissionModel.schema;

export type PermissionPopulate = keyof TFilterPopulateFields<
  Permission,
  PermissionStub
>;

export const PERMISSION_POPULATE: PermissionPopulate[] = ['model', 'role'];
