/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { PickType } from '@nestjs/mapped-types';
import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import { DtoConfig } from '@/utils/types/dto.types';
import { IsObjectId } from '@/utils/validation-rules/is-object-id';

export class UserCreateDto {
  @ApiProperty({ description: 'User username', type: String })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ description: 'User first name', type: String })
  @IsNotEmpty()
  @IsString()
  first_name: string;

  @ApiProperty({ description: 'User last name', type: String })
  @IsNotEmpty()
  @IsString()
  last_name: string;

  @ApiProperty({ description: 'User email', type: String })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password', type: String })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ description: 'User roles', type: String })
  @IsNotEmpty()
  @IsArray()
  @IsObjectId({ each: true, message: 'Role must be a valid ObjectId' })
  roles: string[];

  @ApiPropertyOptional({ description: 'Avatar', type: String })
  @IsOptional()
  @IsString()
  @IsObjectId({ message: 'Avatar must be a valid ObjectId' })
  avatar: string | null = null;

  @ApiPropertyOptional({
    description: 'User state',
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  state?: boolean;
}

export class UserEditProfileDto extends OmitType(PartialType(UserCreateDto), [
  'username',
  'roles',
  'avatar',
  'state',
]) {
  @ApiPropertyOptional({ description: 'User language', type: String })
  @IsOptional()
  @IsString()
  language?: string;
}

export class UserUpdateStateAndRolesDto {
  @ApiPropertyOptional({
    description: 'User state',
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  state?: boolean;

  @ApiPropertyOptional({
    description: 'User roles',
    type: Boolean,
  })
  @IsOptional()
  @IsArray()
  @IsObjectId({ each: true, message: 'Role must be a valid ObjectId' })
  roles?: string[];
}

export class UserResetPasswordDto extends PickType(UserCreateDto, [
  'password',
]) {}

export class UserRequestResetDto extends PickType(UserCreateDto, ['email']) {}

export type UserDto = DtoConfig<{
  create: UserCreateDto;
}>;
