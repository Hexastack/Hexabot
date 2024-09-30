/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString, IsOptional } from 'class-validator';

import { TRelation } from '../types/index.type';
import { TModel } from '../types/model.type';

export class ModelCreateDto {
  @ApiProperty({ description: 'Name of the model', type: String })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Identity of the model', type: String })
  @IsNotEmpty()
  @IsString()
  identity: TModel;

  @ApiProperty({
    description: 'Attributes of the model',
    type: Object,
    nullable: true,
  })
  @IsNotEmpty()
  @IsObject()
  attributes: object;

  @ApiProperty({
    description: 'relation of the model',
    type: String,
  })
  @IsString()
  @IsOptional()
  relation?: TRelation;
}
