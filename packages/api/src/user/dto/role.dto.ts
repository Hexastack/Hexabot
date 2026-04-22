/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { coerceUser, type User } from '@hexabot-ai/types';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { BaseStub, TDto } from '@/utils/types/dto.types';

import { Permission } from './permission.dto';

@Exclude()
export class RoleStub extends BaseStub {
  @Expose()
  id!: string;

  @Expose()
  code!: string;

  @Expose()
  label!: string;

  @Expose()
  name!: string;

  @Expose()
  active!: boolean;
}

@Exclude()
export class Role extends RoleStub {}

@Exclude()
export class RoleFull extends RoleStub {
  @Expose()
  @Type(() => Permission)
  permissions?: Permission[];

  @Expose()
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((user) => coerceUser(user)) : [],
  )
  users: User[];
}

export class RoleCreateDto {
  @ApiProperty({ description: 'Name of the role', type: String })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Is the role active',
    type: String,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class RoleUpdateDto extends PartialType(RoleCreateDto) {}

export type RoleDto = TDto<
  {
    plain: typeof Role;
    full: typeof RoleFull;
  },
  {
    create: RoleCreateDto;
    update: RoleUpdateDto;
  }
>;
