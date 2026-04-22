/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  StepExecutionRecord,
  WorkflowRunStatus,
  WorkflowSnapshot,
} from '@hexabot-ai/agentic';
import {
  workflowRunFullSchema,
  workflowRunSchema,
  workflowRunStubSchema,
  type WorkflowRun,
  type WorkflowRunFull,
  type WorkflowRunStub,
} from '@hexabot-ai/types';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import { TDto } from '@/utils/types/dto.types';

import { WORKFLOW_RUN_STATUSES } from '../entities/workflow-run.entity';

export { workflowRunFullSchema, workflowRunSchema, workflowRunStubSchema };

export type { WorkflowRun, WorkflowRunFull, WorkflowRunStub };

export class WorkflowRunCreateDto {
  @ApiProperty({ description: 'Workflow to execute', type: String })
  @IsNotEmpty()
  @IsUUIDv4({
    message: 'Workflow must be a valid UUID',
  })
  workflow!: string;

  @ApiPropertyOptional({
    description: 'User who triggered the run',
    type: String,
  })
  @IsOptional()
  @IsUUIDv4({
    message: 'Triggering user must be a valid UUID',
  })
  triggeredBy?: string | null;

  @ApiPropertyOptional({
    description: 'Conversation thread associated with the run',
    type: String,
  })
  @IsOptional()
  @IsUUIDv4({
    message: 'Thread must be a valid UUID',
  })
  thread?: string | null;

  @ApiPropertyOptional({
    description: 'Workflow version executed by the run',
    type: String,
  })
  @IsOptional()
  @IsUUIDv4({
    message: 'Workflow version must be a valid UUID',
  })
  workflowVersion?: string | null;

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

  @ApiPropertyOptional({ description: 'Step execution log', type: Object })
  @IsOptional()
  @IsObject()
  stepLog?: Record<string, StepExecutionRecord> | null;

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

  @ApiPropertyOptional({
    description: 'Step execution attempt id for suspension replay',
    type: String,
  })
  @IsOptional()
  @IsString()
  suspensionStepExecId?: string | null;

  @ApiPropertyOptional({
    description: '1-based suspension index within the step',
    type: Number,
  })
  @IsOptional()
  @IsInt()
  suspensionIndex?: number | null;

  @ApiPropertyOptional({
    description: 'Normalized key of the active suspension point',
    type: String,
  })
  @IsOptional()
  @IsString()
  suspensionKey?: string | null;

  @ApiPropertyOptional({
    description:
      'Previously resumed suspension values for deterministic replay',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  suspensionAwaitResults?: Record<string, unknown> | null;

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

  @ApiPropertyOptional({ description: 'Opaque metadata', type: Object })
  @IsOptional()
  metadata?: Record<string, unknown> | null;
}

export class WorkflowRunUpdateDto extends PartialType(WorkflowRunCreateDto) {}

export type WorkflowRunDto = TDto<
  {
    plain: typeof workflowRunSchema;
    full: typeof workflowRunFullSchema;
  },
  {
    create: WorkflowRunCreateDto;
    update: WorkflowRunUpdateDto;
  }
>;
