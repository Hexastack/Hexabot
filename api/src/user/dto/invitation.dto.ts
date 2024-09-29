/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsEmail, IsString } from 'class-validator';

import { IsObjectId } from '@/utils/validation-rules/is-object-id';

export class InvitationCreateDto {
  @ApiProperty({ description: 'Invitation roles', type: String })
  @IsNotEmpty()
  @IsArray()
  @IsObjectId({ each: true, message: 'Invalid Object Id' })
  roles: string[];

  @ApiProperty({ description: 'Invitation email', type: String })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;
}
