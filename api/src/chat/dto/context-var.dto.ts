/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { DtoConfig } from '@/utils/types/dto.types';

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

export type ContextVarDto = DtoConfig<{
  create: ContextVarCreateDto;
}>;
