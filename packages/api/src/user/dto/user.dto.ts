/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { PickType } from '@nestjs/mapped-types';
import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
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

import { Attachment } from '@/attachment/dto/attachment.dto';
import { SubscriberCreateDto } from '@/chat/dto/subscriber.dto';
import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';

import { UserProvider } from '../types/user-provider.type';

import { Role } from './role.dto';

@Exclude()
export class UserStub extends BaseStub {
  @Expose()
  username!: string;

  @Expose()
  first_name!: string;

  @Expose()
  last_name!: string;

  @Expose()
  email!: string;

  @Expose()
  sendEmail!: boolean;

  @Expose()
  state!: boolean;

  @Expose()
  language!: string;

  @Expose()
  timezone!: string;

  @Expose()
  resetCount!: number;

  @Expose()
  resetToken!: string | null;

  @Expose()
  provider?: UserProvider;
}

@Exclude()
export class User extends UserStub {
  @Expose({ name: 'roleIds' })
  roles: string[];

  @Expose({ name: 'avatarId' })
  avatar: string;
}

@Exclude()
export class UserFull extends UserStub {
  @Expose()
  @Type(() => Role)
  roles: Role[];

  @Expose()
  @Type(() => Attachment)
  avatar: Attachment | null;
}

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
  @ArrayNotEmpty()
  @IsArray()
  @IsUUIDv4({ each: true, message: 'Role must be a valid UUID' })
  roles: string[];

  @ApiPropertyOptional({ description: 'Avatar', type: String })
  @IsOptional()
  @IsString()
  @IsUUIDv4({ message: 'Avatar must be a valid UUID' })
  avatar: string | null = null;

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

export type UserTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof User;
  FullCls: typeof UserFull;
}>;

export type UserDtoConfig = DtoActionConfig<{
  create: UserCreateDto;
  update: UserUpdateDto | Partial<SubscriberCreateDto>;
}>;
