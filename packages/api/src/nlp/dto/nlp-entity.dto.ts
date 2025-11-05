/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
} from 'class-validator';

import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';

import { Lookup, LookupStrategy } from '..//types';

import { NlpValue } from './nlp-value.dto';

@Exclude()
export class NlpEntityStub extends BaseStub {
  @Expose()
  @Transform(({ value, obj }) => {
    const resolved = value ?? obj?.foreign_id ?? null;

    return resolved === null ? undefined : resolved;
  })
  foreignId?: string | null;

  @Expose()
  name!: string;

  @Expose()
  lookups!: Lookup[];

  @Expose()
  @Transform(({ value }) => (value === null ? undefined : value))
  doc?: string | null;

  @Expose()
  builtin!: boolean;

  @Expose()
  weight!: number;
}

@Exclude()
export class NlpEntity extends NlpEntityStub {
  @Exclude()
  values?: never;
}

@Exclude()
export class NlpEntityFull extends NlpEntityStub {
  @Expose()
  @Type(() => NlpValue)
  values!: NlpValue[];
}

export class NlpEntityCreateDto {
  @ApiProperty({ description: 'Name of the NLP entity', type: String })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Only alphanumeric characters and underscores are allowed.',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Lookup strategies for the entity',
    isArray: true,
    enum: LookupStrategy,
    default: [LookupStrategy.keywords],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(LookupStrategy, { each: true })
  lookups?: Lookup[];

  @ApiPropertyOptional({
    description: 'Entity description',
    type: String,
  })
  @IsOptional()
  @IsString()
  doc?: string;

  @ApiPropertyOptional({
    description: 'Foreign identifier for the entity',
    type: String,
  })
  @IsOptional()
  @IsString()
  foreignId?: string;

  @ApiPropertyOptional({
    description: 'Indicates if the entity is built-in',
    type: Boolean,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  builtin?: boolean;

  @ApiPropertyOptional({
    description:
      'Weight used to determine the next block to trigger in the flow',
    type: Number,
    minimum: 1,
  })
  @IsOptional()
  @IsPositive({ message: 'Weight must be a strictly positive number' })
  weight?: number;
}

export class NlpEntityUpdateDto extends PartialType(NlpEntityCreateDto) {}

export type NlpEntityTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof NlpEntity;
  FullCls: typeof NlpEntityFull;
}>;

export type NlpEntityDtoConfig = DtoActionConfig<{
  create: NlpEntityCreateDto;
  update: NlpEntityUpdateDto;
}>;
