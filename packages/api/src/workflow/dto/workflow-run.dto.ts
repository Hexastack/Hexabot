/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowRunStatus, WorkflowSnapshot } from '@hexabot-ai/agentic';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

import { Subscriber } from '@/chat/dto/subscriber.dto';
import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';

import { WORKFLOW_RUN_STATUSES } from '../entities/workflow-run.entity';

import { Workflow } from './workflow.dto';

@Exclude()
export class WorkflowRunStub extends BaseStub {
  @Expose()
  status!: WorkflowRunStatus;

  @Expose()
  input?: Record<string, unknown> | null;

  @Expose()
  output?: Record<string, unknown> | null;

  @Expose()
  memory?: Record<string, unknown> | null;

  @Expose()
  context?: Record<string, unknown> | null;

  @Expose()
  snapshot?: WorkflowSnapshot | null;

  @Expose()
  suspendedStep?: string | null;

  @Expose()
  suspensionReason?: string | null;

  @Expose()
  suspensionData?: unknown;

  @Expose()
  lastResumeData?: unknown;

  @Expose()
  error?: string | null;

  @Expose()
  suspendedAt?: Date | null;

  @Expose()
  finishedAt?: Date | null;

  @Expose()
  failedAt?: Date | null;

  @Expose()
  correlationId?: string | null;

  @Expose()
  metadata?: Record<string, unknown> | null;
}

@Exclude()
export class WorkflowRun extends WorkflowRunStub {
  @Expose({ name: 'workflowId' })
  workflow!: string;

  @Expose({ name: 'subscriberId' })
  @Transform(({ value }) => (value == null ? undefined : value))
  subscriber?: string | null;
}

@Exclude()
export class WorkflowRunFull extends WorkflowRunStub {
  @Expose()
  @Type(() => Workflow)
  workflow!: Workflow;

  @Expose()
  @Type(() => Subscriber)
  subscriber?: Subscriber | null;
}

export class WorkflowRunCreateDto {
  @ApiProperty({ description: 'Workflow to execute', type: String })
  @IsNotEmpty()
  @IsUUIDv4({
    message: 'Workflow must be a valid UUID',
  })
  workflow!: string;

  @ApiPropertyOptional({
    description: 'Subscriber linked to the run',
    type: String,
  })
  @IsOptional()
  @IsUUIDv4({
    message: 'Subscriber must be a valid UUID',
  })
  subscriber?: string | null;

  @ApiPropertyOptional({
    description: 'Lifecycle status of the run',
    enum: WORKFLOW_RUN_STATUSES,
  })
  @IsOptional()
  @IsIn(WORKFLOW_RUN_STATUSES)
  status?: WorkflowRunStatus;

  @ApiPropertyOptional({ description: 'Input payload', type: Object })
  @IsOptional()
  @IsObject()
  input?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: 'Current memory state', type: Object })
  @IsOptional()
  @IsObject()
  memory?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: 'Context snapshot', type: Object })
  @IsOptional()
  @IsObject()
  context?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: 'Workflow output', type: Object })
  @IsOptional()
  @IsObject()
  output?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: 'Runner snapshot', type: Object })
  @IsOptional()
  @IsObject()
  snapshot?: WorkflowSnapshot | null;

  @ApiPropertyOptional({
    description: 'Step id where the run is suspended',
    type: String,
  })
  @IsOptional()
  @IsString()
  suspendedStep?: string | null;

  @ApiPropertyOptional({ description: 'Suspension reason', type: String })
  @IsOptional()
  @IsString()
  suspensionReason?: string | null;

  @ApiPropertyOptional({ description: 'Suspension payload', type: Object })
  @IsOptional()
  suspensionData?: unknown;

  @ApiPropertyOptional({ description: 'Last resume payload', type: Object })
  @IsOptional()
  lastResumeData?: unknown;

  @ApiPropertyOptional({ description: 'Error message if failed', type: String })
  @IsOptional()
  @IsString()
  error?: string | null;

  @ApiPropertyOptional({ description: 'Suspension timestamp', type: Date })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  suspendedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Completion timestamp', type: Date })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  finishedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Failure timestamp', type: Date })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  failedAt?: Date | null;

  @ApiPropertyOptional({
    description: 'External identifier used to correlate events',
    type: String,
  })
  @IsOptional()
  @IsString()
  correlationId?: string | null;

  @ApiPropertyOptional({ description: 'Opaque metadata', type: Object })
  @IsOptional()
  metadata?: Record<string, unknown> | null;
}

export type WorkflowRunTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof WorkflowRun;
  FullCls: typeof WorkflowRunFull;
}>;

export class WorkflowRunUpdateDto extends PartialType(WorkflowRunCreateDto) {}

export type WorkflowRunDtoConfig = DtoActionConfig<{
  create: WorkflowRunCreateDto;
  update: WorkflowRunUpdateDto;
}>;

export type WorkflowRunDto = WorkflowRunDtoConfig;
