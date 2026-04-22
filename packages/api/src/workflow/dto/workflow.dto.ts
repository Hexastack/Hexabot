/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowDefinition } from '@hexabot-ai/agentic';
import { coerceUser, type User } from '@hexabot-ai/types';
import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { JSONSchema7 as JsonSchema } from 'json-schema';
import { z } from 'zod';

import { Validate } from '@/utils';
import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import { BaseStub, TDto } from '@/utils/types/dto.types';

import { parseWorkflowDefinition } from '../lib/workflow-definition';
import { NestCronSchema } from '../schemas/workflow-schemas';
import { DirectionType, WorkflowType } from '../types';

import { WorkflowVersion } from './workflow-version.dto';

const WorkflowInputSchemaValidator = z.looseObject({});

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
  inputSchema!: JsonSchema;

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

  @Expose({ name: 'publishedVersionId' })
  publishedVersion: string | null;

  @Expose({ name: 'createdById' })
  createdBy!: string;

  @Expose({ name: 'runAfterMs' })
  runAfterMs!: number;
}

@Exclude()
export class WorkflowFull extends WorkflowStub {
  @Expose()
  @Type(() => WorkflowVersion)
  currentVersion!: WorkflowVersion | null;

  @Expose()
  @Type(() => WorkflowVersion)
  publishedVersion!: WorkflowVersion | null;

  @Expose()
  @Transform(({ value }) => (value == null ? value : coerceUser(value)))
  createdBy!: User;

  @Expose()
  @Transform(({ obj }) => {
    const definitionYml = obj?.currentVersion?.definitionYml;
    if (typeof definitionYml !== 'string' || definitionYml.trim() === '') {
      return undefined;
    }

    return definitionYml;
  })
  definitionYml?: string;

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
    description:
      'JSON Schema for workflow input. Editable only for manual workflows.',
    type: Object,
  })
  @IsOptional()
  @Validate(WorkflowInputSchemaValidator)
  inputSchema?: JsonSchema;

  @ApiPropertyOptional({
    description: 'Indicates if the workflow is built-in',
    type: Boolean,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  builtin?: boolean;

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
  @IsOptional()
  @IsUUIDv4({
    message: 'createdBy must be a valid UUID',
  })
  createdBy!: string;
}

export class WorkflowUpdateDto extends PartialType(
  OmitType(WorkflowCreateDto, ['type'] as const),
) {
  @ApiProperty({ description: 'Current version', type: String })
  @IsOptional()
  @IsUUIDv4({
    message: 'Current version must be a valid UUID',
  })
  currentVersion?: string | null;

  @ApiPropertyOptional({ description: 'Published version', type: String })
  @IsOptional()
  @IsUUIDv4({
    message: 'Published version must be a valid UUID',
  })
  publishedVersion?: string | null;
}

export type WorkflowDto = TDto<
  {
    plain: typeof Workflow;
    full: typeof WorkflowFull;
  },
  {
    create: WorkflowCreateDto;
    update: WorkflowUpdateDto;
  }
>;
