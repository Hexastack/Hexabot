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
import { IsUUIDv4 } from '@hexabot/core/decorators';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

import { LabelGroup } from './label-group.dto';
import { Subscriber } from './subscriber.dto';

@Exclude()
export class LabelStub extends BaseStub {
  @Expose()
  title!: string;

  @Expose()
  name!: string;

  @Expose()
  @Transform(({ value }) => (value == null ? undefined : value))
  label_id?: Record<string, any> | null;

  @Expose()
  @Transform(({ value }) => (value == null ? undefined : value))
  description?: string | null;

  @Expose()
  builtin!: boolean;
}

@Exclude()
export class Label extends LabelStub {
  @Expose({ name: 'groupId' })
  group?: string | null;

  @Exclude()
  users?: never;
}

@Exclude()
export class LabelFull extends LabelStub {
  @Expose()
  @Type(() => Subscriber)
  users?: Subscriber[];

  @Expose()
  @Type(() => LabelGroup)
  group?: LabelGroup | null;
}

export class LabelCreateDto {
  @ApiProperty({ description: 'Label title', type: String })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Label name', type: String })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Z_0-9]+$/)
  name: string;

  @ApiPropertyOptional({
    description: 'Label group',
    type: String,
    default: null,
  })
  @IsOptional()
  @IsString()
  @IsUUIDv4({ message: 'group must be a valid UUID' })
  group?: string | null;

  @ApiPropertyOptional({ description: 'Label description', type: String })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Label id', type: Object })
  @IsOptional()
  @IsObject()
  label_id?: Record<string, any>;
}

export class LabelUpdateDto extends PartialType(LabelCreateDto) {}

export type LabelTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof Label;
  FullCls: typeof LabelFull;
}>;

export type LabelDtoConfig = DtoActionConfig<{
  create: LabelCreateDto;
  update: LabelUpdateDto;
}>;

export type LabelDto = LabelDtoConfig;
