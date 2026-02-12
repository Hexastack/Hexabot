/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

import { BaseStub } from '@/utils';

@Exclude()
export class UserProfileStub extends BaseStub {
  @Expose()
  firstName!: string;

  @Expose()
  lastName!: string;

  @Expose()
  language!: string | null;

  @Expose()
  timezone: number = 0;
}

@Exclude()
export class UserProfileAssignedStub extends UserProfileStub {
  @Expose()
  username?: string;

  @Expose()
  email?: string;

  @Expose({ name: 'avatarId' })
  avatar?: string | null;
}

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
