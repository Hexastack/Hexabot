/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { PickType } from '@nestjs/mapped-types';
import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsArray,
  IsBoolean,
  IsOptional,
} from 'class-validator';

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
  avatar?: string;
}

export class UserEditProfileDto extends OmitType(PartialType(UserCreateDto), [
  'username',
  'roles',
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
