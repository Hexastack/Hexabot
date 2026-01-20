/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowDefinition } from '@hexabot-ai/agentic';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

import { User } from '@/user/dto/user.dto';
import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';

import { IsWorkflowDefinition } from '../decorators/is-workflow-definition.decorator';
import { DirectionType, WorkflowType } from '../types';

import { MemoryDefinition } from './memory-definition.dto';

@Exclude()
export class WorkflowStub extends BaseStub {
  @Expose()
  name!: string;

  @Expose()
  version!: string;

  @Expose()
  description?: string | null;

  @Expose()
  type!: WorkflowType;

  @Expose()
  schedule?: string | null;

  @Expose()
  builtin!: boolean;

  @Expose()
  definition!: WorkflowDefinition;

  @Expose()
  x!: number;

  @Expose()
  y!: number;

  @Expose()
  zoom!: number;

  @Expose()
  direction: DirectionType;
}

@Exclude()
export class Workflow extends WorkflowStub {
  @Expose({ name: 'createdById' })
  createdBy!: string;

  @Expose({ name: 'memoryDefinitionIds' })
  memoryDefinitions!: string[];
}

@Exclude()
export class WorkflowFull extends WorkflowStub {
  @Expose()
  @Type(() => User)
  createdBy!: User;

  @Expose()
  @Type(() => MemoryDefinition)
  memoryDefinitions!: MemoryDefinition[];
}

export class WorkflowNewDto {
  @ApiProperty({ description: 'Workflow name', type: String })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Workflow version', type: String })
  @IsNotEmpty()
  @IsString()
  version!: string;

  @ApiPropertyOptional({ description: 'Workflow description', type: String })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Workflow trigger type',
    enumName: 'WorkflowType',
    enum: WorkflowType,
    default: WorkflowType.conversational,
  })
  @IsOptional()
  @IsEnum(WorkflowType)
  type: WorkflowType = WorkflowType.conversational;

  @ApiPropertyOptional({
    description: 'Cron expression used when the workflow is scheduled',
    type: String,
  })
  @ValidateIf((payload) => payload.schedule !== undefined)
  @IsOptional()
  @IsString()
  schedule?: string | null;

  @ApiPropertyOptional({
    description: 'Indicates if the workflow is built-in',
    type: Boolean,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  builtin?: boolean;

  @ApiPropertyOptional({
    description: 'Memory definitions available to this workflow',
    type: [String],
  })
  @IsArray()
  @IsUUIDv4({ each: true, message: 'Memory definition must be a valid UUID' })
  memoryDefinitions: string[];

  @ApiProperty({ description: 'Workflow definition object', type: Object })
  @IsNotEmpty()
  @IsObject()
  @IsWorkflowDefinition()
  definition!: WorkflowDefinition;

  @ApiPropertyOptional({
    description: 'Workflow x offset',
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  x?: number;

  @ApiPropertyOptional({
    description: 'Workflow y offset',
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  y?: number;

  @ApiPropertyOptional({
    description: 'Workflow zoom',
    type: Number,
  })
  @IsNumber({ maxDecimalPlaces: 20 })
  @IsOptional()
  zoom?: number;

  @ApiPropertyOptional({
    description: 'Workflow direction',
    type: Number,
  })
  @IsEnum(DirectionType)
  @IsOptional()
  direction?: DirectionType;
}

export class WorkflowCreateDto extends WorkflowNewDto {
  @ApiProperty({ description: 'Workflow creator', type: String })
  @IsUUIDv4({
    message: 'createdBy must be a valid UUID',
  })
  createdBy!: string;
}

export type WorkflowTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof Workflow;
  FullCls: typeof WorkflowFull;
}>;

export class WorkflowUpdateDto extends PartialType(WorkflowCreateDto) {}

export type WorkflowDtoConfig = DtoActionConfig<{
  create: WorkflowCreateDto;
  update: WorkflowUpdateDto;
}>;

export type WorkflowDto = WorkflowDtoConfig;
