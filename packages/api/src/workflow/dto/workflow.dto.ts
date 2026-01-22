/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowDefinition } from '@hexabot-ai/agentic';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

import { User } from '@/user/dto/user.dto';
import { Validate } from '@/utils';
import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';

import { IsWorkflowYaml } from '../decorators/is-workflow-yaml.decorator';
import { parseWorkflowDefinition } from '../lib/workflow-definition';
import { NestCronSchema } from '../schemas/workflow-schemas';
import { DirectionType, WorkflowType } from '../types';

import { MemoryDefinition } from './memory-definition.dto';
import { WorkflowVersion } from './workflow-version.dto';

@Exclude()
export class WorkflowStub extends BaseStub {
  @Expose()
  name!: string;

  @Expose()
  description?: string | null;

  @Expose()
  type!: WorkflowType;

  @Expose()
  schedule?: string | null;

  @Expose()
  builtin!: boolean;

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
  @Expose({ name: 'currentVersionId' })
  currentVersion: string | null;

  @Expose({ name: 'createdById' })
  createdBy!: string;

  @Expose({ name: 'memoryDefinitionIds' })
  memoryDefinitions!: string[];
}

@Exclude()
export class WorkflowFull extends WorkflowStub {
  @Expose()
  @Type(() => WorkflowVersion)
  currentVersion!: WorkflowVersion | null;

  @Expose()
  @Type(() => User)
  createdBy!: User;

  @Expose()
  @Type(() => MemoryDefinition)
  memoryDefinitions!: MemoryDefinition[];

  @Expose()
  @Transform(({ obj }) => {
    const definitionYml = obj?.currentVersion?.definitionYml;
    if (typeof definitionYml !== 'string' || definitionYml.trim() === '') {
      return undefined;
    }

    return parseWorkflowDefinition(definitionYml);
  })
  definition?: WorkflowDefinition;
}

export class WorkflowCreateDto {
  @ApiProperty({ description: 'Workflow name', type: String })
  @IsNotEmpty()
  @IsString()
  name!: string;

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
  type?: WorkflowType;

  @ApiPropertyOptional({
    description: 'Cron expression used when the workflow is scheduled',
    type: String,
  })
  @ValidateIf((payload) => payload.schedule !== undefined)
  @IsOptional()
  @IsString()
  @Validate(NestCronSchema)
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

  @ApiProperty({ description: 'Workflow creator', type: String })
  @IsUUIDv4({
    message: 'createdBy must be a valid UUID',
  })
  createdBy!: string;
}

export class WorkflowNewVersionDto extends WorkflowCreateDto {
  @ApiPropertyOptional({
    description: 'Workflow definition YAML',
    type: String,
  })
  @IsString()
  @IsWorkflowYaml()
  definitionYml: string;

  @ApiPropertyOptional({
    description: 'Workflow version message',
    type: String,
  })
  @IsOptional()
  @IsString()
  message?: string;
}

export type WorkflowTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof Workflow;
  FullCls: typeof WorkflowFull;
}>;

export class WorkflowUpdateDto extends PartialType(WorkflowCreateDto) {
  @ApiPropertyOptional({
    description: 'Workflow trigger type',
    enumName: 'WorkflowType',
    enum: WorkflowType,
  })
  @IsOptional()
  @IsEnum(WorkflowType)
  type?: WorkflowType;

  @ApiProperty({ description: 'Current version', type: String })
  @IsOptional()
  @IsUUIDv4({
    message: 'Current version must be a valid UUID',
  })
  currentVersion?: string | null;

  @ApiProperty({ description: 'Workflow updater', type: String })
  @IsUUIDv4({
    message: 'updatedBy must be a valid UUID',
  })
  updatedBy?: string | null;
}

export class WorkflowVersionCommitDto extends WorkflowUpdateDto {
  @ApiPropertyOptional({
    description: 'Workflow definition YAML',
    type: String,
  })
  @IsString()
  @IsWorkflowYaml()
  definitionYml?: string;

  @ApiPropertyOptional({
    description: 'Workflow version message',
    type: String,
  })
  @IsOptional()
  @IsString()
  message?: string;
}

export type WorkflowDtoConfig = DtoActionConfig<{
  create: WorkflowCreateDto;
  update: WorkflowUpdateDto;
}>;

export type WorkflowDto = WorkflowDtoConfig;
