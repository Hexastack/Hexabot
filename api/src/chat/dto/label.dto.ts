/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

import { DtoConfig } from '@/utils/types/dto.types';
import { IsObjectId } from '@/utils/validation-rules/is-object-id';

export class LabelCreateDto {
  @ApiProperty({ description: 'Label title', type: String })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Label name', type: String })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Z_0-9]+$/)
  name: string;

  @ApiPropertyOptional({
    description: 'Label group',
    type: String,
    default: null,
  })
  @IsOptional()
  @IsString()
  @IsObjectId({ message: 'group must be a valid ObjectId' })
  group?: string | null;

  @ApiPropertyOptional({ description: 'Label description', type: String })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Label id', type: Object })
  @IsOptional()
  @IsObject()
  label_id?: Record<string, any>;
}

export class LabelUpdateDto extends PartialType(LabelCreateDto) {}

export type LabelDto = DtoConfig<{
  create: LabelCreateDto;
}>;
