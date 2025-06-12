/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Validate,
  ValidateNested,
} from 'class-validator';

import { FieldType } from '@/setting/schemas/types';
import { DtoConfig } from '@/utils/types/dto.types';

import { UniqueFieldNames } from '../decorators/unique-field-names.decorator';
import { ValidateRequiredFields } from '../validators/validate-required-fields.validator';

export class ContentField {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(FieldType, {
    message:
      "type must be one of the following values: 'text', 'url', 'textarea', 'checkbox', 'file', 'html'",
  })
  type: `${FieldType}`;
}

export class ContentTypeCreateDto {
  @ApiProperty({ description: 'Content type name', type: String })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Content type fields',
    type: ContentField,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Validate(ValidateRequiredFields)
  @Type(() => ContentField)
  @UniqueFieldNames()
  fields?: ContentField[];
}

export class ContentTypeUpdateDto extends PartialType(ContentTypeCreateDto) {}

export type ContentTypeDto = DtoConfig<{
  create: ContentTypeCreateDto;
}>;
