/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import { DtoConfig } from '@/utils/types/dto.types';
import { IsObjectId } from '@/utils/validation-rules/is-object-id';

import { NlpSampleEntityValue, NlpSampleState } from '../schemas/types';

export class NlpSampleCreateDto {
  @ApiProperty({ description: 'NLP sample text', type: String })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({
    description: 'If NLP sample is trained',
    type: Boolean,
  })
  @IsBoolean()
  @IsOptional()
  trained?: boolean;

  @ApiPropertyOptional({
    description: 'NLP sample type',
    enum: Object.values(NlpSampleState),
  })
  @IsString()
  @IsIn(Object.values(NlpSampleState))
  @IsOptional()
  type?: keyof typeof NlpSampleState;

  @ApiProperty({ description: 'NLP sample language id', type: String })
  @IsString()
  @IsNotEmpty()
  @IsObjectId({ message: 'Language must be a valid ObjectId' })
  language: string;
}

export class NlpSampleDto extends NlpSampleCreateDto {
  @ApiPropertyOptional({
    description: 'nlp sample entities',
  })
  @IsOptional()
  entities?: NlpSampleEntityValue[];

  @ApiProperty({ description: 'NLP sample language code', type: String })
  @IsString()
  @IsNotEmpty()
  language: string;
}

export class NlpSampleUpdateDto extends PartialType(NlpSampleCreateDto) {}

export type TNlpSampleDto = DtoConfig<{
  create: NlpSampleCreateDto;
}>;
