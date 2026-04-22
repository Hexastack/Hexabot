/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  labelFullSchema,
  labelSchema,
  labelStubSchema,
  type Label,
  type LabelFull,
  type LabelStub,
} from '@hexabot-ai/types';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import { TDto } from '@/utils/types/dto.types';

export { labelFullSchema, labelSchema, labelStubSchema };

export type { Label, LabelFull, LabelStub };

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

  @ApiPropertyOptional({
    description: 'Label group',
    type: String,
    default: null,
  })
  @IsOptional()
  @IsString()
  @IsUUIDv4({ message: 'group must be a valid UUID' })
  group?: string | null;

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

export type LabelDto = TDto<
  {
    plain: typeof labelSchema;
    full: typeof labelFullSchema;
  },
  {
    create: LabelCreateDto;
    update: LabelUpdateDto;
  }
>;
