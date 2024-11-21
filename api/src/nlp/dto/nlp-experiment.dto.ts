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
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

import { IsObjectId } from '@/utils/validation-rules/is-object-id';

import { NlpMetricValue } from '../schemas/nlp-metric-value.schema';
import { NlpParameterValue } from '../schemas/nlp-parameter-value.schema';

export class NlpExperimentCreateDto {
  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional() // Optional since it is not required in the schema
  foreign_id?: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  run_name?: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  @IsOptional()
  current_version?: number;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  @IsObjectId({ message: 'Model must be a valid ObjectId' })
  model: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({ type: Object, default: {} })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ type: Boolean, default: false })
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @ApiPropertyOptional({ type: [String], default: [] })
  @IsArray()
  @IsOptional()
  tags?: string[];
}

export class NlpExperimentDto extends NlpExperimentCreateDto {
  @ApiProperty({ description: 'Nlp Parameters Value' })
  @IsNotEmpty()
  parameters: NlpParameterValue[];
}

export class NlpExperimentUpdateDto extends NlpExperimentCreateDto {
  @ApiProperty({ description: ' Nlp Metrics Values' })
  @IsNotEmpty()
  metrics: NlpMetricValue[];
}
