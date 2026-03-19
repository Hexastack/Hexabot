/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDefined,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';

import { SettingSchema } from '../types';

@Exclude()
export class SettingStub extends BaseStub {
  @Expose()
  group!: string;

  @Expose()
  @Transform(({ obj }) => obj.subgroup || undefined)
  subgroup?: string;

  @Expose()
  label!: string;

  @Expose()
  schema!: SettingSchema;

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
    description: 'JSON Schema describing the setting value',
    type: Object,
    additionalProperties: true,
  })
  @IsDefined()
  @IsObject()
  schema: SettingSchema;

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
  @ApiPropertyOptional({
    description: 'JSON Schema describing the setting value',
    type: Object,
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  schema?: SettingSchema;

  @ApiPropertyOptional({
    description:
      'Defines the display order of the setting in the user interface',
    type: Number,
  })
  @IsOptional()
  weight?: number;
}

export class SettingGroupUpdateDto {
  @ApiProperty({ description: 'Values to persist for the settings group' })
  @IsDefined()
  @IsObject()
  values!: Record<string, unknown>;
}

export type SettingTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof Setting;
  FullCls: typeof Setting;
}>;

export type SettingDtoConfig = DtoActionConfig<{
  create: SettingCreateDto;
  update: SettingUpdateDto;
}>;
