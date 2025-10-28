/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { z } from 'zod';

import { Validate } from '@/utils/decorators/validate.decorator';
import { SanitizeQueryPipe } from '@/utils/pipes/sanitize-query.pipe';
import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';

import { DEFAULT_BLOCK_SEARCH_LIMIT } from '../constants/block';
import { CaptureVar, captureVarSchema } from '../types/capture-var';
import { BlockMessage, blockMessageObjectSchema } from '../types/message';
import { BlockOptions, BlockOptionsSchema } from '../types/options';
import { Pattern, patternSchema } from '../types/pattern';
import { Position, positionSchema } from '../types/position';

import { Category } from './category.dto';
import { Label } from './label.dto';

@Exclude()
export class BlockStub extends BaseStub {
  @Expose()
  name!: string;

  @Expose()
  patterns!: Pattern[];

  @Expose()
  outcomes!: string[];

  @Expose()
  trigger_channels!: string[];

  @Expose()
  options: BlockOptions;

  @Expose()
  message!: BlockMessage;

  @Expose()
  starts_conversation!: boolean;

  @Expose()
  capture_vars!: CaptureVar[];

  @Expose()
  @Transform(({ value }) => (value == null ? undefined : value))
  position?: Position | null;

  @Expose()
  builtin!: boolean;
}

@Exclude()
export class Block extends BlockStub {
  @Expose({ name: 'triggerLabelIds' })
  trigger_labels!: string[];

  @Expose({ name: 'assignLabelIds' })
  assign_labels!: string[];

  @Expose({ name: 'nextBlockIds' })
  nextBlocks!: string[];

  @Expose({ name: 'attachedBlockId' })
  @Transform(({ value }) => (value == null ? undefined : value))
  attachedBlock?: string | null;

  @Expose({ name: 'categoryId' })
  @Transform(({ value }) => (value == null ? undefined : value))
  category?: string | null;

  @Exclude()
  previousBlocks?: never;

  @Exclude()
  attachedToBlock?: never;
}

@Exclude()
export class BlockFull extends BlockStub {
  @Expose()
  @Type(() => Label)
  trigger_labels!: Label[];

  @Expose()
  @Type(() => Label)
  assign_labels!: Label[];

  @Expose()
  @Type(() => Block)
  nextBlocks!: Block[];

  @Expose()
  @Type(() => Block)
  attachedBlock?: Block | null;

  @Expose()
  @Type(() => Category)
  category?: Category | null;

  @Expose()
  @Type(() => Block)
  previousBlocks?: Block[];

  @Expose()
  @Type(() => Block)
  attachedToBlock?: Block | null;
}

@Exclude()
export class SearchRankedBlock extends Block {
  @Expose()
  score!: number;
}

export class BlockCreateDto {
  @ApiProperty({ description: 'Block name', type: String })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Block patterns', type: Array })
  @IsOptional()
  @Validate(z.array(patternSchema))
  patterns?: Pattern[] = [];

  @ApiPropertyOptional({
    description: "Block's outcomes",
    type: Array,
  })
  @IsOptional()
  @IsArray({ message: 'Outcomes are invalid' })
  outcomes?: string[] = [];

  @ApiPropertyOptional({ description: 'Block trigger labels', type: Array })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Trigger label must be a valid UUID' })
  trigger_labels?: string[] = [];

  @ApiPropertyOptional({ description: 'Block assign labels', type: Array })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Assign label must be a valid UUID' })
  assign_labels?: string[] = [];

  @ApiPropertyOptional({ description: 'Block trigger channels', type: Array })
  @IsOptional()
  @IsArray()
  trigger_channels?: string[] = [];

  @ApiPropertyOptional({ description: 'Block options', type: Object })
  @IsOptional()
  @IsObject()
  @Validate(BlockOptionsSchema)
  options?: BlockOptions;

  @ApiProperty({ description: 'Block message', type: Object })
  @IsNotEmpty()
  @Validate(blockMessageObjectSchema)
  message: BlockMessage;

  @ApiPropertyOptional({ description: 'next blocks', type: Array })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Next block must be a valid UUID' })
  nextBlocks?: string[];

  @ApiPropertyOptional({ description: 'attached blocks', type: String })
  @IsOptional()
  @IsString()
  @IsUUID('4', {
    message: 'Attached block must be a valid UUID',
  })
  attachedBlock?: string | null;

  @ApiProperty({ description: 'Block category', type: String })
  @IsNotEmpty()
  @IsString()
  @IsUUID('4', { message: 'Category must be a valid UUID' })
  category: string | null;

  @ApiPropertyOptional({
    description: 'Block has started conversation',
    type: Boolean,
  })
  @IsBoolean()
  @IsOptional()
  starts_conversation?: boolean;

  @ApiPropertyOptional({
    description: 'Block capture vars',
    type: Array,
  })
  @IsOptional()
  @Validate(z.array(captureVarSchema))
  capture_vars?: CaptureVar[];

  @ApiProperty({
    description: 'Block position',
    type: Object,
  })
  @IsNotEmpty()
  @Validate(positionSchema)
  position: Position;
}

export class BlockUpdateDto extends PartialType(
  OmitType(BlockCreateDto, [
    'patterns',
    'outcomes',
    'trigger_labels',
    'assign_labels',
    'trigger_channels',
  ]),
) {
  @ApiPropertyOptional({ description: 'Block patterns', type: Array })
  @IsOptional()
  @Validate(z.array(patternSchema))
  patterns?: Pattern[];

  @ApiPropertyOptional({
    description: "Block's outcomes",
    type: Array,
  })
  @IsOptional()
  @IsArray({ message: 'Outcomes are invalid' })
  outcomes?: string[];

  @ApiPropertyOptional({ description: 'Block trigger labels', type: Array })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Trigger label must be a valid UUID' })
  trigger_labels?: string[];

  @ApiPropertyOptional({ description: 'Block assign labels', type: Array })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Assign label must be a valid UUID' })
  assign_labels?: string[];

  @ApiPropertyOptional({ description: 'Block trigger channels', type: Array })
  @IsArray()
  @IsOptional()
  trigger_channels?: string[];
}

export class BlockSearchQueryDto {
  @ApiPropertyOptional({
    description: 'Search term to filter blocks',
    type: String,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => SanitizeQueryPipe.sanitize(value))
  q?: string;

  @ApiPropertyOptional({
    description: `Maximum number of results to return (default: ${DEFAULT_BLOCK_SEARCH_LIMIT}, max: ${DEFAULT_BLOCK_SEARCH_LIMIT})`,
    type: Number,
    default: DEFAULT_BLOCK_SEARCH_LIMIT,
    maximum: DEFAULT_BLOCK_SEARCH_LIMIT,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(DEFAULT_BLOCK_SEARCH_LIMIT)
  limit: number = DEFAULT_BLOCK_SEARCH_LIMIT;

  @ApiPropertyOptional({
    description: 'Category to filter search results',
    type: String,
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @IsUUID('4', { message: 'Category must be a valid UUID' })
  category?: string;
}

export type BlockTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof Block;
  FullCls: typeof BlockFull;
}>;

export type BlockDtoConfig = DtoActionConfig<{
  create: BlockCreateDto;
  update: BlockUpdateDto;
}>;

export type BlockDto = BlockDtoConfig;
