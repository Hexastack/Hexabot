/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  type UserProfile,
  userProfileFullSchema,
  userProfileSchema,
  userProfileStubSchema,
  type UserProfileFull,
  type UserProfileStub,
} from '@hexabot-ai/types';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { TDto } from '@/utils';

export { userProfileFullSchema, userProfileSchema, userProfileStubSchema };

export type { UserProfile, UserProfileFull, UserProfileStub };

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
