/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
