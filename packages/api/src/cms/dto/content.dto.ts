/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';

import { ContentType } from './contentType.dto';

@Exclude()
export class ContentStub extends BaseStub {
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
export class Content extends ContentStub {
  @Expose({ name: 'contentTypeId' })
  contentType!: string;
}

@Exclude()
export class ContentFull extends ContentStub {
  @Expose()
  @Type(() => ContentType)
  contentType!: ContentType;
}

export class ContentCreateDto {
  @ApiProperty({ description: 'Content entity', type: String })
  @IsString()
  @IsNotEmpty()
  @IsUUIDv4({ message: 'Content Type must be a valid UUID' })
  contentType: string;

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
