/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsString,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class TranslationCreateDto {
  @ApiProperty({ description: 'Translation str', type: String })
  @IsNotEmpty()
  @IsString()
  str: string;

  @ApiProperty({ description: 'Translations', type: Object })
  @IsNotEmpty()
  @IsObject()
  translations: Record<string, string>;

  @ApiProperty({ description: 'Translated', type: Number })
  @IsNotEmpty()
  @IsNumber()
  translated: number;
}

export class TranslationUpdateDto {
  @ApiPropertyOptional({ description: 'Translation str', type: String })
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  str?: string;

  @ApiPropertyOptional({ description: 'Translations', type: Object })
  @IsNotEmpty()
  @IsObject()
  @IsOptional()
  translations?: Record<string, string>;
}
