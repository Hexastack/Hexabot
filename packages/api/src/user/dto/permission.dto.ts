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
import { IsUUIDv4 } from '@hexabot/core/decorators';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { Action } from '../types/action.type';
import { TRelation } from '../types/index.type';

import { Model } from './model.dto';
import { Role } from './role.dto';

@Exclude()
export class PermissionStub extends BaseStub {
  @Expose()
  action: string;

  @Expose()
  relation: TRelation;
}

@Exclude()
export class Permission extends PermissionStub {
  @Expose({ name: 'modelId' })
  model: string;

  @Expose({ name: 'roleId' })
  role: string;
}

@Exclude()
export class PermissionFull extends PermissionStub {
  @Expose()
  @Type(() => Model)
  model: Model;

  @Expose()
  @Type(() => Role)
  role: Role;
}

export class PermissionCreateDto {
  @ApiProperty({ description: 'Id of the model', type: String })
  @IsNotEmpty()
  @IsString()
  @IsUUIDv4({ message: 'Model must be a valid UUID' })
  model: string;

  @ApiProperty({ description: 'Action to perform on the model', enum: Action })
  @IsNotEmpty()
  @IsEnum(Action)
  action: Action;

  @IsNotEmpty()
  @ApiProperty({ description: 'Id of the role', type: String })
  @IsString()
  @IsUUIDv4({ message: 'Role must be a valid UUID' })
  role: string;

  @ApiProperty({
    description: 'relation of the permission',
    type: String,
  })
  @IsString()
  @IsOptional()
  relation?: TRelation;
}

export type PermissionTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof Permission;
  FullCls: typeof PermissionFull;
}>;

export type PermissionDtoConfig = DtoActionConfig<{
  create: PermissionCreateDto;
}>;
