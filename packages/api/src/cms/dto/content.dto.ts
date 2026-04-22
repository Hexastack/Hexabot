/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  contentFullSchema,
  contentSchema,
  contentStubSchema,
  type Content,
  type ContentFull,
  type ContentStub,
} from '@hexabot-ai/types';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import { TDto } from '@/utils/types/dto.types';

export { contentFullSchema, contentSchema, contentStubSchema };

export type { Content, ContentFull, ContentStub };

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

  @ApiPropertyOptional({ description: 'Content properties', type: Object })
  @IsOptional()
  properties?: Record<string, any>;
}

export class ContentUpdateDto extends PartialType(ContentCreateDto) {}

export type ContentDto = TDto<
  {
    plain: typeof contentSchema;
    full: typeof contentFullSchema;
  },
  {
    create: ContentCreateDto;
    update: ContentUpdateDto;
  }
>;
