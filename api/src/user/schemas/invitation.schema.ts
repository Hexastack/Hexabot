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
import { isEmail } from '@/utils/validation-rules/is-email';

import { Role } from './role.schema';

@Schema({ timestamps: true })
class InvitationStub extends BaseSchema {
  /**
   * The roles assigned to the user.
   */
  @Prop([
    {
      type: MongooseSchema.Types.ObjectId,
      ref: 'Role',
    },
  ])
  roles: unknown;

  /**
   * The user's email address.
   */
  @Prop({
    type: String,
    required: true,
    validate: {
      validator: isEmail,
      message: (props) => `${props.value} is not a valid email!`,
    },
  })
  email: string;

  @Prop({
    type: String,
    required: true,
  })
  token: string;
}

@Schema({ timestamps: true })
export class Invitation extends InvitationStub {
  @Transform(({ obj }) => obj.roles.map((role) => role.toString()))
  roles: string[];
}

@Schema({ timestamps: true })
export class InvitationFull extends InvitationStub {
  @Type(() => Role)
  roles: Role[];
}

export type InvitationDocument = THydratedDocument<Invitation>;

export const InvitationModel: ModelDefinition = LifecycleHookManager.attach({
  name: Invitation.name,
  schema: SchemaFactory.createForClass(Invitation),
});

export default InvitationModel.schema;

export type InvitationPopulate = keyof TFilterPopulateFields<
  Invitation,
  InvitationStub
>;

export const INVITATION_POPULATE: InvitationPopulate[] = ['roles'];
