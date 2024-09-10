/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Prop, Schema, SchemaFactory, ModelDefinition } from '@nestjs/mongoose';
import { Transform, Type } from 'class-transformer';
import { THydratedDocument, Schema as MongooseSchema } from 'mongoose';

import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';

import { Model } from './model.schema';
import { Role } from './role.schema';
import { Action } from '../types/action.type';

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
  relation?: string;
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
