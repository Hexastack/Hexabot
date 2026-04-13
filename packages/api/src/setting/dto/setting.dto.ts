/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsDefined, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { BaseStub, TDto } from '@/utils/types/dto.types';

@Exclude()
export class SettingStub extends BaseStub {
  @Expose()
  group!: string;

  @Expose()
  subgroup?: string;

  @Expose()
  label!: string;

  @Expose()
  value!: null | string | number | boolean | string[] | Record<string, any>;
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

  @ApiProperty({ description: 'Setting value' })
  @IsNotEmpty()
  value: any;
}

export class SettingUpdateDto {
  @ApiProperty({ description: 'value of the setting' })
  @IsDefined()
  value: null | string | number | boolean | string[] | Record<string, any>;
}

export type SettingDto = TDto<
  {
    plain: typeof Setting;
    full: typeof Setting;
  },
  {
    create: SettingCreateDto;
    update: SettingUpdateDto;
  }
>;
