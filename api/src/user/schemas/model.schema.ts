/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Prop, Schema, SchemaFactory, ModelDefinition } from '@nestjs/mongoose';
import { Exclude, Type } from 'class-transformer';
import { THydratedDocument } from 'mongoose';

import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';

import { Permission } from './permission.schema';
import { TRelation } from '../types/index.type';

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
