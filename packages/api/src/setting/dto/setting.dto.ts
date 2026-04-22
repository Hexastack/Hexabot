/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  settingFullSchema,
  settingSchema,
  settingStubSchema,
  type Setting,
  type SettingFull,
  type SettingStub,
} from '@hexabot-ai/types';
import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { TDto } from '@/utils/types/dto.types';

export { settingFullSchema, settingSchema, settingStubSchema };

export type { Setting, SettingFull, SettingStub };

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
    plain: typeof settingSchema;
    full: typeof settingFullSchema;
  },
  {
    create: SettingCreateDto;
    update: SettingUpdateDto;
  }
>;
