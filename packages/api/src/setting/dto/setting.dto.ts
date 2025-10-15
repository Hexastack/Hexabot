/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDefined,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import { SettingType } from '../types';

export class SettingCreateDto {
  @ApiProperty({ description: 'Setting group', type: String })
  @IsNotEmpty()
  @IsString()
  group: string;

  @ApiProperty({ description: 'Setting subgroup', type: String })
  @IsOptional()
  @IsString()
  subgroup?: string;

  @ApiProperty({ description: 'Setting label (system name)', type: String })
  @IsNotEmpty()
  @IsString()
  label: string;

  @ApiProperty({
    description: 'Setting type',
    enum: [
      'text',
      'multiple_text',
      'checkbox',
      'select',
      'number',
      'attachment',
      'multiple_attachment',
    ],
  })
  @IsNotEmpty()
  @IsIn(Object.values(SettingType))
  type: SettingType;

  @ApiProperty({ description: 'Setting value' })
  @IsNotEmpty()
  value: any;

  @ApiPropertyOptional({
    description: 'Setting options (required when type is select)',
    isArray: true,
    type: Array,
  })
  @IsArray()
  @IsOptional()
  options?: string[];

  //TODO: adding swagger decorators
  config?: Record<string, any>;

  @ApiPropertyOptional({
    description:
      'Defines the display order of the setting in the user interface',
    type: Number,
  })
  weight: number;

  @ApiPropertyOptional({
    description: 'Indicates whether this setting supports translation',
    type: Boolean,
  })
  @IsBoolean()
  @IsOptional()
  translatable?: boolean;
}

export class SettingUpdateDto {
  @ApiProperty({ description: 'value of the setting' })
  @IsDefined()
  value: null | string | number | boolean | string[] | Record<string, any>;
}
