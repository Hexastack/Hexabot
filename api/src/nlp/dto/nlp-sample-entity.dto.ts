/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

import { IsObjectId } from '@/utils/validation-rules/is-object-id';

export class NlpSampleEntityCreateDto {
  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  @IsOptional()
  start?: number;

  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  @IsOptional()
  end?: number;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  @IsObjectId({ message: 'Entity must be a valid ObjectId' })
  entity: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  @IsObjectId({ message: 'Value must be a valid ObjectId' })
  value: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  @IsObjectId({ message: 'Sample must be a valid ObjectId' })
  sample: string;
}
