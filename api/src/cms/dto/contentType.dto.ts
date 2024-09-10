/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsEnum,
  Matches,
  IsNotEmpty,
  Validate,
} from 'class-validator';

import { ValidateRequiredFields } from '../validators/validate-required-fields.validator';

export class FieldType {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z][a-z_0-9]*$/)
  name: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsEnum(['text', 'url', 'textarea', 'checkbox', 'file', 'html'], {
    message:
      "type must be one of the following values: 'text', 'url', 'textarea', 'checkbox', 'file', 'html'",
  })
  type: string;
}

export class ContentTypeCreateDto {
  @ApiProperty({ description: 'Content type name', type: String })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Content type fields', type: FieldType })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Validate(ValidateRequiredFields)
  @Type(() => FieldType)
  fields?: FieldType[];
}

export class ContentTypeUpdateDto extends PartialType(ContentTypeCreateDto) {}
