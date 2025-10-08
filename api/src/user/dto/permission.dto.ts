/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { DtoConfig } from '@/utils/types/dto.types';
import { IsObjectId } from '@/utils/validation-rules/is-object-id';

import { Action } from '../types/action.type';
import { TRelation } from '../types/index.type';

export class PermissionCreateDto {
  @ApiProperty({ description: 'Id of the model', type: String })
  @IsNotEmpty()
  @IsString()
  @IsObjectId({ message: 'Model must be a valid ObjectId' })
  model: string;

  @ApiProperty({ description: 'Action to perform on the model', enum: Action })
  @IsNotEmpty()
  @IsEnum(Action)
  action: Action;

  @IsNotEmpty()
  @ApiProperty({ description: 'Id of the role', type: String })
  @IsString()
  @IsObjectId({ message: 'Role must be a valid ObjectId' })
  role: string;

  @ApiProperty({
    description: 'relation of the permission',
    type: String,
  })
  @IsString()
  @IsOptional()
  relation?: TRelation;
}

export type PermissionDto = DtoConfig<{
  create: PermissionCreateDto;
}>;
