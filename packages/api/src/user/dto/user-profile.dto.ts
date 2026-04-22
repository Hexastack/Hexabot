/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { userProfileFullSchema, userProfileSchema } from '@hexabot-ai/types';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { TDto } from '@/utils';

export class UserProfileCreateDto {
  @ApiProperty({ description: `User Profile firstName`, type: String })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'User Profile lastName', type: String })
  @IsNotEmpty()
  @IsString()
  lastName: string;
}

export type UserProfileDto = TDto<{
  plain: typeof userProfileSchema;
  full: typeof userProfileFullSchema;
}>;
