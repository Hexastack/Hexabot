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

import { Attachment } from '@/attachment/schemas/attachment.schema';
import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';
import {
  TFilterPopulateFields,
  THydratedDocument,
} from '@/utils/types/filter.types';

import { UserProvider } from '../types/user-provider.type';

import { Role } from './role.schema';

@Schema({ timestamps: true })
export class UserStub extends BaseSchema {
  @Prop({
    type: String,
    unique: true,
    required: true,
  })
  username: string;

  @Prop({ type: String })
  first_name: string;

  @Prop({ type: String })
  last_name: string;

  @Prop({
    type: String,
    unique: true,
    required: true,
  })
  email: string;

  @Prop({
    type: String,
    required: true,
  })
  password: string;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Role' }])
  roles: unknown;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Attachment',
    default: null,
  })
  avatar: unknown;

  @Prop({
    type: Boolean,
    default: false,
  })
  sendEmail?: boolean;

  @Prop({
    type: Boolean,
    default: true,
  })
  state?: boolean;

  @Prop({
    type: String,
    maxLength: 2,
    minLength: 2,
    default: 'en',
  })
  language?: string;

  @Prop({
    type: String,
    maxLength: 255,
    default: 'Europe/Berlin',
  })
  timezone?: string;

  @Prop({
    type: Number,
    default: 0,
  })
  resetCount?: number;

  @Prop({
    type: String,
    default: null,
  })
  resetToken?: string | null;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: { strategy: 'local' },
  })
  provider?: UserProvider;
}

@Schema({ timestamps: true })
export class User extends UserStub {
  @Transform(({ obj }) => obj.roles.map((elem) => elem.toString()))
  roles: string[];

  @Transform(({ obj }) => obj.avatar?.toString() || null)
  avatar: string | null;
}

@Schema({ timestamps: true })
export class UserFull extends UserStub {
  @Type(() => Role)
  roles: Role[];

  @Type(() => Attachment)
  avatar: Attachment | null;
}

export type UserDocument = THydratedDocument<User>;

export const UserModel: ModelDefinition = LifecycleHookManager.attach({
  name: User.name,
  schema: SchemaFactory.createForClass(User),
});

export default UserModel.schema;

export type UserPopulate = keyof TFilterPopulateFields<User, UserStub>;

export const USER_POPULATE: UserPopulate[] = ['roles', 'avatar'];
