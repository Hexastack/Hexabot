/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  contentTypeFullSchema,
  contentTypeSchema,
  contentTypeStubSchema,
  type ContentType,
  type ContentTypeFull,
  type ContentTypeStub,
} from '@hexabot-ai/types';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { JSONSchema7 as JsonSchema } from 'json-schema';
import { z } from 'zod';

import { FieldType } from '@/setting/types';
import { Validate } from '@/utils/decorators/validate.decorator';
import { TDto } from '@/utils/types/dto.types';

export { contentTypeFullSchema, contentTypeSchema, contentTypeStubSchema };

export type { ContentType, ContentTypeFull, ContentTypeStub };

export class ContentField {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(FieldType, {
    message:
      "type must be one of the following values: 'text', 'url', 'textarea', 'checkbox', 'file', 'html'",
  })
  type: `${FieldType}`;
}

export class ContentTypeCreateDto {
  @ApiProperty({ description: 'Content type name', type: String })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'JSON Schema describing the content structure',
    type: Object,
  })
  @Validate(z.looseObject({}))
  schema!: JsonSchema;
}

export class ContentTypeUpdateDto extends PartialType(ContentTypeCreateDto) {}

export type ContentTypeDto = TDto<
  {
    plain: typeof contentTypeSchema;
    full: typeof contentTypeFullSchema;
  },
  {
    create: ContentTypeCreateDto;
    update: ContentTypeUpdateDto;
  }
>;
