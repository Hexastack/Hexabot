/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { roleFullSchema, roleSchema } from '@hexabot-ai/types';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { TDto } from '@/utils/types/dto.types';

export class RoleCreateDto {
  @ApiProperty({ description: 'Name of the role', type: String })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Is the role active',
    type: String,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class RoleUpdateDto extends PartialType(RoleCreateDto) {}

export type RoleDto = TDto<
  {
    plain: typeof roleSchema;
    full: typeof roleFullSchema;
  },
  {
    create: RoleCreateDto;
    update: RoleUpdateDto;
  }
>;
