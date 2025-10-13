/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
