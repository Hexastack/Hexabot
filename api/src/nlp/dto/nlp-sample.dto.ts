/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import { NlpSampleEntityValue, NlpSampleState } from '../schemas/types';

export class NlpSampleCreateDto {
  @ApiProperty({ description: 'nlp sample text', type: String })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({ description: 'nlp sample is trained', type: Boolean })
  @IsBoolean()
  @IsOptional()
  trained?: boolean;

  @ApiPropertyOptional({
    description: 'nlp sample type',
    enum: Object.values(NlpSampleState),
  })
  @IsString()
  @IsIn(Object.values(NlpSampleState))
  @IsOptional()
  type?: NlpSampleState;
}

export class NlpSampleDto extends NlpSampleCreateDto {
  @ApiPropertyOptional({
    description: 'nlp sample entities',
  })
  @IsOptional()
  entities?: NlpSampleEntityValue[];
}

export class NlpSampleUpdateDto extends PartialType(NlpSampleCreateDto) {}
