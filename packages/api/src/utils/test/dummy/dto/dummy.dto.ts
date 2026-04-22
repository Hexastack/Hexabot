/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  dummyFullSchema,
  dummySchema,
  dummyStubSchema,
  type Dummy,
  type DummyFull,
  type DummyStub,
} from '@hexabot-ai/types';
import { IsObject, IsOptional, IsString } from 'class-validator';

import { DtoAction, TDto } from '@/utils/types/dto.types';

export { dummyFullSchema, dummySchema, dummyStubSchema };

export type { Dummy, DummyFull, DummyStub };

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
    plain: typeof dummySchema;
    full: typeof dummyFullSchema;
  },
  {
    [DtoAction.CREATE]: DummyCreateDto;
    [DtoAction.UPDATE]: DummyUpdateDto;
  }
>;
