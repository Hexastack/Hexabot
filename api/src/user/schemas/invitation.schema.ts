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
