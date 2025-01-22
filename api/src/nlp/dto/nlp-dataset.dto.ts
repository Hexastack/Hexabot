/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

import { StorageModeEnum } from '../schemas/storage-mode.enum';

export class NlpDatasetCreateDto {
  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional() // Optional since it is not required in the schema
  foreign_id?: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  @IsNotEmpty()
  current_version: number;

  @ApiProperty({
    description: 'Storage Mode',
    enum: StorageModeEnum,
    type: StorageModeEnum,
  })
  @IsEnum(StorageModeEnum)
  @IsNotEmpty()
  storage_mode: StorageModeEnum;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  uri: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiPropertyOptional({ type: Object, default: {} })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ type: [String], default: [] })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({ description: 'Nlp Parameters Value' })
  @IsNotEmpty()
  @IsArray()
  @IsObject({ each: true, message: 'parameter must be a valid object' })
  experiments: string[];
}
