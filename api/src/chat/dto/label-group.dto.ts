/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { DtoConfig } from '@/utils/types/dto.types';

export class LabelGroupCreateDto {
  @ApiProperty({ description: 'Label group name', type: String })
  @IsNotEmpty()
  @IsString()
  name: string;
}

export class LabelGroupUpdateDto extends LabelGroupCreateDto {}

export type LabelGroupDto = DtoConfig<{
  create: LabelGroupCreateDto;
  update: LabelGroupUpdateDto;
}>;
