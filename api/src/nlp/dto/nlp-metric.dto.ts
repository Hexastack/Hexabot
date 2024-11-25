/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { IsObjectId } from '@/utils/validation-rules/is-object-id';

export class NlpMetricCreateDto {
  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional() // Optional since it is not required in the schema
  foreign_id?: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class NlpMetricDto extends NlpMetricCreateDto {
  @ApiPropertyOptional({
    description: 'nlp models',
  })
  @IsOptional()
  models?: string[];

  @ApiPropertyOptional({ description: 'NLP experiments' })
  @IsOptional()
  @IsArray()
  @IsObjectId({ each: true, message: 'Experiment must be a valid ObjectId' })
  experiments?: string[];
}
