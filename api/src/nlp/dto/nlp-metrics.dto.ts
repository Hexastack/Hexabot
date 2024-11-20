/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class NlpMetricsCreateDto {
  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional() // Optional since it is not required in the schema
  foreign_id?: string;

  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  @IsOptional()
  accuracy?: number;

  @ApiProperty({ type: Number })
  @IsNumber()
  @IsOptional()
  val_accuracy?: number;

  @ApiProperty({ type: Number })
  @IsNumber()
  @IsOptional()
  loss?: number;

  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  @IsOptional()
  val_loss?: number;

  @ApiProperty({ type: Number })
  @IsNumber()
  @IsOptional()
  recall?: number;

  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  @IsOptional()
  val_recall?: number;

  @ApiProperty({ type: Number })
  @IsNumber()
  @IsOptional()
  precision?: number;

  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  @IsOptional()
  val_precision?: number;

  @ApiProperty({ type: Number })
  @IsNumber()
  @IsOptional()
  f1score?: number;

  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  @IsOptional()
  val_f1score?: number;
}
