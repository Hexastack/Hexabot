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
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@Exclude()
export class ContextVarStub extends BaseStub {
  @Expose()
  label!: string;

  @Expose()
  name!: string;

  @Expose()
  permanent!: boolean;
}

@Exclude()
export class ContextVar extends ContextVarStub {}

@Exclude()
export class ContextVarFull extends ContextVarStub {}

export class ContextVarCreateDto {
  @ApiProperty({ description: 'Context var label', type: String })
  @IsNotEmpty()
  @IsString()
  label: string;

  @ApiProperty({ description: 'Context var name', type: String })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Is context var permanent', type: Boolean })
  @IsOptional()
  @IsBoolean()
  permanent?: boolean;
}

export class ContextVarUpdateDto extends PartialType(ContextVarCreateDto) {}

export type ContextVarTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof ContextVar;
  FullCls: typeof ContextVarFull;
}>;

export type ContextVarDtoConfig = DtoActionConfig<{
  create: ContextVarCreateDto;
  update: ContextVarUpdateDto;
}>;

export type ContextVarDto = ContextVarDtoConfig;
