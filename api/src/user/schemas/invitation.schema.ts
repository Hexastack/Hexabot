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
