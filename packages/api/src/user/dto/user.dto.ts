/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  type User,
  userFullSchema,
  userSchema,
  userStubSchema,
  type UserFull,
  type UserProvider,
  type UserStub,
} from '@hexabot-ai/types';
import { PickType } from '@nestjs/mapped-types';
import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import { SubscriberCreateDto } from '@/chat/dto/subscriber.dto';
import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import { TDto } from '@/utils/types/dto.types';

import { UserProfileCreateDto } from './user-profile.dto';

export { userFullSchema, userSchema, userStubSchema };

export type { User, UserFull, UserProvider, UserStub };

export class UserCreateDto extends UserProfileCreateDto {
  @ApiProperty({ description: 'User username', type: String })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ description: 'User email', type: String })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password', type: String })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ description: 'User roles', type: String })
  @ArrayNotEmpty()
  @IsArray()
  @IsUUIDv4({ each: true, message: 'Role must be a valid UUID' })
  roles: string[];

  @ApiPropertyOptional({ description: 'Avatar', type: String })
  @IsOptional()
  @IsString()
  @IsUUIDv4({ message: 'Avatar must be a valid UUID' })
  avatar: string | null;

  @ApiPropertyOptional({
    description: 'User state',
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  state?: boolean;
}

export class UserUpdateDto extends PartialType(UserCreateDto) {
  @ApiPropertyOptional({ description: 'User language', type: String })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'User timezone', type: String })
  @IsOptional()
  @IsString()
  timezone?: number;

  @ApiPropertyOptional({
    description: 'Send automated emails to the user',
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;

  @ApiPropertyOptional({
    description: 'Password reset token',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  resetToken?: string | null;

  @ApiPropertyOptional({
    description: 'Password reset counter',
    type: Number,
  })
  @IsOptional()
  @IsInt()
  resetCount?: number;

  @ApiPropertyOptional({
    description: 'Authentication provider metadata',
    type: Object,
  })
  @IsOptional()
  provider?: UserProvider;
}

export class UserEditProfileDto extends OmitType(UserUpdateDto, [
  'username',
  'roles',
  'avatar',
  'state',
  'sendEmail',
  'resetToken',
  'resetCount',
  'provider',
]) {}

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
  @IsUUIDv4({ each: true, message: 'Role must be a valid UUID' })
  roles?: string[];
}

export class UserResetPasswordDto extends PickType(UserCreateDto, [
  'password',
]) {}

export class UserRequestResetDto extends PickType(UserCreateDto, ['email']) {}

export type UserDto = TDto<
  {
    plain: typeof userSchema;
    full: typeof userFullSchema;
  },
  {
    create: UserCreateDto;
    update: UserUpdateDto | Partial<SubscriberCreateDto>;
  }
>;
