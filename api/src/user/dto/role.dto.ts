/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { DtoConfig } from '@/utils/types/dto.types';

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

export type RoleDto = DtoConfig<{
  create: RoleCreateDto;
}>;
