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

import { Permission } from './permission.schema';
import { User } from './user.schema';

export type TRole = 'admin' | 'public';

@Schema({ timestamps: true })
export class RoleStub extends BaseSchema {
  @Prop({
    type: String,
    unique: true,
    required: true,
  })
  name: string;

  @Prop({ type: Boolean, default: true })
  active: boolean;
}

@Schema({ timestamps: true })
export class Role extends RoleStub {
  @Exclude()
  permissions?: never;

  @Exclude()
  users?: never;
}

@Schema({ timestamps: true })
export class RoleFull extends RoleStub {
  @Type(() => Permission)
  permissions: Permission[];

  @Type(() => User)
  users: User[];
}

export type RoleDocument = THydratedDocument<Role>;

export const RoleModel: ModelDefinition = LifecycleHookManager.attach({
  name: Role.name,
  schema: SchemaFactory.createForClass(RoleStub),
});

RoleModel.schema.virtual('permissions', {
  ref: 'Permission',
  localField: '_id',
  foreignField: 'role',
});

RoleModel.schema.virtual('users', {
  ref: 'User',
  localField: '_id',
  foreignField: 'roles',
});

export default RoleModel.schema;

export type RolePopulate = keyof TFilterPopulateFields<Role, RoleStub>;

export const ROLE_POPULATE: RolePopulate[] = ['permissions', 'users'];
