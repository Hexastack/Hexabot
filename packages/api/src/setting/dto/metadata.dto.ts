/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@hexabot/core/database';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

@Exclude()
export class MetadataStub extends BaseStub {
  @Expose()
  name!: string;

  @Expose()
  value!: any;
}

@Exclude()
export class Metadata extends MetadataStub {}

export class MetadataCreateDto {
  @ApiProperty({ description: 'Metadata name', type: String })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Metadata value' })
  @IsNotEmpty()
  value: any;
}

export class MetadataUpdateDto extends PartialType(MetadataCreateDto) {}

export type MetadataTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof Metadata;
  FullCls: typeof Metadata;
}>;

export type MetadataDtoConfig = DtoActionConfig<{
  create: MetadataCreateDto;
  update: MetadataUpdateDto;
}>;
