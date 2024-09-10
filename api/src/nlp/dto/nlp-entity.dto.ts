/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  Matches,
  IsIn,
  IsNotEmpty,
} from 'class-validator';

export type Lookup = 'keywords' | 'trait' | 'free-text';

export class NlpEntityCreateDto {
  @ApiProperty({ description: 'Name of the nlp entity', type: String })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Only alphanumeric characters and underscores are allowed.',
  })
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    isArray: true,
    enum: ['keywords', 'trait', 'free-text'],
  })
  @IsArray()
  @IsIn(['keywords', 'trait', 'free-text'], { each: true })
  @IsOptional()
  lookups?: Lookup[];

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  doc?: string;

  @ApiPropertyOptional({ description: 'Nlp entity is builtin', type: Boolean })
  @IsBoolean()
  @IsOptional()
  builtin?: boolean;
}
