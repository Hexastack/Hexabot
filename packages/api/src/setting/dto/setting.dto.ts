/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@hexabot/core/database';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
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

@Exclude()
export class SettingStub extends BaseStub {
  @Expose()
  group!: string;

  @Expose()
  @Transform(({ obj }) => obj.options || undefined)
  subgroup?: string;

  @Expose()
  label!: string;

  @Expose()
  type!: SettingType;

  @Expose()
  value!: null | string | number | boolean | string[] | Record<string, any>;

  @Expose()
  @Transform(({ obj }) => obj.options || undefined)
  options?: string[];

  @Expose()
  @Transform(({ obj }) => obj.config || undefined)
  config?: Record<string, any>;

  @Expose()
  weight?: number;

  @Expose()
  translatable?: boolean;
}

@Exclude()
export class Setting extends SettingStub {}

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
  @IsOptional()
  weight?: number;

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

  @ApiPropertyOptional({
    description:
      'Defines the display order of the setting in the user interface',
    type: Number,
  })
  @IsOptional()
  weight?: number;
}

export type SettingTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof Setting;
  FullCls: typeof Setting;
}>;

export type SettingDtoConfig = DtoActionConfig<{
  create: SettingCreateDto;
  update: SettingUpdateDto;
}>;
