/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { DtoConfig } from '@/utils/types/dto.types';

export class LanguageCreateDto {
  @ApiProperty({ description: 'Language Title', type: String })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Language Code', type: String })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ description: 'Whether Language is RTL', type: Boolean })
  @IsBoolean()
  isRTL: boolean;

  @ApiPropertyOptional({ description: 'Is Default Language ?', type: Boolean })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class LanguageUpdateDto extends PartialType(LanguageCreateDto) {}

export type LanguageDto = DtoConfig<{
  create: LanguageCreateDto;
}>;
