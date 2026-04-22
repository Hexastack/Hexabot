/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { metadataFullSchema, metadataSchema } from '@hexabot-ai/types';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { TDto } from '@/utils/types/dto.types';

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

export type MetadataDto = TDto<
  {
    plain: typeof metadataSchema;
    full: typeof metadataFullSchema;
  },
  {
    create: MetadataCreateDto;
    update: MetadataUpdateDto;
  }
>;
