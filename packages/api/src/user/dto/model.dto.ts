/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  modelFullSchema,
  modelSchema,
  modelStubSchema,
  type Model,
  type ModelFull,
  type ModelStub,
} from '@hexabot-ai/types';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

import { TDto } from '@/utils/types/dto.types';

import { TRelation } from '../types/index.type';
import { TModel } from '../types/model.type';

export { modelFullSchema, modelSchema, modelStubSchema };

export type { Model, ModelFull, ModelStub };

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

export type ModelDto = TDto<
  {
    plain: typeof modelSchema;
    full: typeof modelFullSchema;
  },
  {
    create: ModelCreateDto;
  }
>;
