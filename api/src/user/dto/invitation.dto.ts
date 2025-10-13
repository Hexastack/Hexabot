/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
