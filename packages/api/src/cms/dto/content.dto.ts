/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';

@Exclude()
export class ContentStub extends BaseStub {
  @Expose()
  entity!: string;

  @Expose()
  title!: string;

  @Expose()
  status!: boolean;

  @Expose()
  dynamicFields!: Record<string, any> | null;

  @Expose()
  rag?: string | null;
}

@Exclude()
export class Content extends ContentStub {}

@Exclude()
export class ContentFull extends Content {}

export class ContentCreateDto {
  @ApiProperty({ description: 'Content entity', type: String })
  @IsString()
  @IsNotEmpty()
  @IsUUID('4', { message: 'Entity must be a valid UUID' })
  entity: string;

  @ApiProperty({ description: 'Content title', type: String })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Content status', type: Boolean })
  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @ApiPropertyOptional({ description: 'Content dynamic fields', type: Object })
  @IsOptional()
  dynamicFields?: Record<string, any>;
}

export class ContentUpdateDto extends PartialType(ContentCreateDto) {}

export type ContentTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof Content;
  FullCls: typeof ContentFull;
}>;

export type ContentDtoConfig = DtoActionConfig<{
  create: ContentCreateDto;
  update: ContentUpdateDto;
}>;
