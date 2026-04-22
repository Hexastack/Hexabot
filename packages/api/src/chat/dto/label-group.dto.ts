/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { labelGroupFullSchema, labelGroupSchema } from '@hexabot-ai/types';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { TDto } from '@/utils/types/dto.types';

export class LabelGroupCreateDto {
  @ApiProperty({ description: 'Label group name', type: String })
  @IsNotEmpty()
  @IsString()
  name: string;
}

export class LabelGroupUpdateDto extends LabelGroupCreateDto {}

export type LabelGroupDto = TDto<
  {
    plain: typeof labelGroupSchema;
    full: typeof labelGroupFullSchema;
  },
  {
    create: LabelGroupCreateDto;
    update: LabelGroupUpdateDto;
  }
>;
