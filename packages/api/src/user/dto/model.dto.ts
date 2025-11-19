/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';

import { TRelation } from '../types/index.type';
import { TModel } from '../types/model.type';

import { Permission } from './permission.dto';

@Exclude()
export class ModelStub extends BaseStub {
  @Expose()
  name: string;

  @Expose()
  identity: string;

  @Expose()
  attributes: object;

  @Expose()
  relation?: TRelation;
}

@Exclude()
export class Model extends ModelStub {}

@Exclude()
export class ModelFull extends ModelStub {
  @Expose()
  @Type(() => Permission)
  permissions?: Permission[];
}

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

export type ModelTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof Model;
  FullCls: typeof ModelFull;
}>;

export type ModelDtoConfig = DtoActionConfig<{
  create: ModelCreateDto;
}>;
