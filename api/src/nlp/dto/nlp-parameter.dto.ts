/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { NlpExperiment } from '../schemas/nlp-experiment.schema';
import { NlpModel } from '../schemas/nlp-model.schema';

export class NlpParameterCreateDto {
  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional() // Optional since it is not required in the schema
  foreign_id?: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class NlpParameterDto extends NlpParameterCreateDto {
  @ApiPropertyOptional({
    description: 'nlp models',
  })
  @IsOptional()
  models?: NlpModel[];

  @ApiPropertyOptional({ description: 'NLP experiments' })
  @IsOptional()
  experiments?: NlpExperiment[];
}
