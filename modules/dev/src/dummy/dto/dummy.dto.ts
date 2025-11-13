/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  BaseStub,
  DtoAction,
  DtoActionConfig,
  DtoTransformer,
  DtoTransformerConfig,
} from '@hexabot/core/database';
import { Exclude, Expose } from 'class-transformer';
import { IsObject, IsOptional, IsString } from 'class-validator';

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

export type DummyTransformerDto = DtoTransformerConfig<{
  [DtoTransformer.PlainCls]: typeof Dummy;
  [DtoTransformer.FullCls]: typeof Dummy;
}>;

export type DummyDtoConfig = DtoActionConfig<{
  [DtoAction.Create]: DummyCreateDto;
  [DtoAction.Update]: DummyUpdateDto;
}>;
