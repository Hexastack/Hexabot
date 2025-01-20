/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { DtoConfig } from '@/utils/types/dto.types';

export class ContextVarCreateDto {
  @ApiProperty({ description: 'Context var label', type: String })
  @IsNotEmpty()
  @IsString()
  label: string;

  @ApiProperty({ description: 'Context var name', type: String })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Is context var permanent', type: Boolean })
  @IsOptional()
  @IsBoolean()
  permanent?: boolean;
}

export class ContextVarUpdateDto extends PartialType(ContextVarCreateDto) {}

export type ContextVarDto = DtoConfig<{
  create: ContextVarCreateDto;
}>;
