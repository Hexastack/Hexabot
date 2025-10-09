/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MetadataCreateDto {
  @ApiProperty({ description: 'Metadata name', type: String })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Metadata value' })
  @IsNotEmpty()
  value: any;
}

export class MetadataUpdateDto extends PartialType(MetadataCreateDto) {}
