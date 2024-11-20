/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

import { IsObjectId } from '@/utils/validation-rules/is-object-id';

export class NlpModelCreateDto {
  @ApiPropertyOptional({ type: String })
  @IsNumber()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  @IsNotEmpty()
  version: number;

  @ApiPropertyOptional({ type: String })
  @IsNumber()
  @IsNotEmpty()
  uri: string;

  @ApiPropertyOptional({ type: Object, default: {} })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsBoolean()
  @IsNotEmpty()
  isActive?: boolean;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true }) // Ensures each item in the array is a string
  @IsObjectId({
    each: true,
    message: 'Each experiment must be a valid ObjectId',
  })
  experiments: string[];
}
