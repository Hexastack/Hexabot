/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@hexabot/core/database';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { Permission } from './permission.dto';
import { User } from './user.dto';

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
  @Type(() => User)
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

export type RoleTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof Role;
  FullCls: typeof RoleFull;
}>;

export type RoleDtoConfig = DtoActionConfig<{
  create: RoleCreateDto;
  update: RoleUpdateDto;
}>;
