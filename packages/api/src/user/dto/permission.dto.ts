/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { permissionFullSchema, permissionSchema } from '@hexabot-ai/types';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import { TDto } from '@/utils/types/dto.types';

import { Action } from '../types/action.type';
import { TRelation } from '../types/index.type';

export class PermissionCreateDto {
  @ApiProperty({ description: 'Id of the model', type: String })
  @IsNotEmpty()
  @IsString()
  @IsUUIDv4({ message: 'Model must be a valid UUID' })
  model: string;

  @ApiProperty({ description: 'Action to perform on the model', enum: Action })
  @IsNotEmpty()
  @IsEnum(Action)
  action: Action;

  @IsNotEmpty()
  @ApiProperty({ description: 'Id of the role', type: String })
  @IsString()
  @IsUUIDv4({ message: 'Role must be a valid UUID' })
  role: string;

  @ApiProperty({
    description: 'relation of the permission',
    type: String,
  })
  @IsString()
  @IsOptional()
  relation?: TRelation;
}

export type PermissionDto = TDto<
  {
    plain: typeof permissionSchema;
    full: typeof permissionFullSchema;
  },
  {
    create: PermissionCreateDto;
  }
>;
