/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

import { IsObjectId } from '@/utils/validation-rules/is-object-id';

export class NlpSampleEntityCreateDto {
  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  @IsOptional()
  start?: number;

  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  @IsOptional()
  end?: number;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  @IsObjectId({ message: 'Entity must be a valid ObjectId' })
  entity: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  @IsObjectId({ message: 'Value must be a valid ObjectId' })
  value: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  @IsObjectId({ message: 'Sample must be a valid ObjectId' })
  sample: string;
}
