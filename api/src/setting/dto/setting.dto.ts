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
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
  IsOptional,
} from 'class-validator';

import { SettingType } from '../schemas/types';

export class SettingCreateDto {
  @ApiProperty({ description: 'Setting group of setting', type: String })
  @IsNotEmpty()
  @IsString()
  group: string;

  @ApiProperty({ description: 'Setting label of setting', type: String })
  @IsNotEmpty()
  @IsString()
  label: string;

  @ApiProperty({
    description: 'Setting type of the setting',
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

  @ApiProperty({ description: 'Setting value of the setting' })
  @IsNotEmpty()
  value: any;

  @ApiPropertyOptional({
    description: 'Setting options',
    isArray: true,
    type: Array,
  })
  @IsArray()
  @IsOptional()
  options?: string[];

  //TODO: adding swagger decorators
  config?: Record<string, any>;

  //TODO: adding swagger decorators
  weight: number;
}

export class SettingUpdateDto {
  @ApiProperty({ description: 'value of the setting' })
  value: null | string | number | boolean | string[] | Record<string, any>;
}
