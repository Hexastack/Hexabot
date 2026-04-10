/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Exclude, Expose } from 'class-transformer';
import { IsObject, IsOptional, IsString } from 'class-validator';

import { BaseStub, DtoAction, DtoType, TDto } from '@/utils/types/dto.types';

@Exclude()
export class DummyStub extends BaseStub {
  @Expose()
  dummy!: string;

  @Expose()
  dynamicField?: Record<string, unknown>;
}

@Exclude()
export class Dummy extends DummyStub {}

export class DummyCreateDto {
  @IsString()
  dummy!: string;

  @IsOptional()
  @IsObject()
  dynamicField?: Record<string, unknown>;
}

export class DummyUpdateDto {
  @IsOptional()
  @IsString()
  dummy?: string;

  @IsOptional()
  @IsObject()
  dynamicField?: Record<string, unknown>;
}

export type DummyDto = TDto<
  {
    [DtoType.PLAIN]: typeof Dummy;
    [DtoType.FULL]: typeof Dummy;
  },
  {
    [DtoAction.CREATE]: DummyCreateDto;
    [DtoAction.UPDATE]: DummyUpdateDto;
  }
>;
