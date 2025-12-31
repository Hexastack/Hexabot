/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowDefinition } from '@hexabot-ai/agentic';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

import { IsUUIDv4 } from '@/utils';
import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';

import { WorkflowType } from '../types';

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
  definition!: WorkflowDefinition;
}

@Exclude()
export class Workflow extends WorkflowStub {}

@Exclude()
export class WorkflowFull extends WorkflowStub {}

export class WorkflowCreateDto {
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

  @ApiProperty({
    description: 'Workflow trigger type',
    enum: Object.values(WorkflowType),
    default: WorkflowType.conversational,
  })
  @IsOptional()
  @IsIn(Object.values(WorkflowType))
  type: WorkflowType = WorkflowType.conversational;

  @ApiPropertyOptional({
    description: 'Cron expression when workflow is scheduled',
    type: String,
  })
  @IsOptional()
  @IsString()
  schedule?: string | null;

  @ApiProperty({ description: 'Workflow definition', type: Object })
  @IsNotEmpty()
  @IsObject()
  definition!: WorkflowDefinition;

  @ApiProperty({
    description: 'Owner : User ID',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @IsUUIDv4({ message: 'CreatedBy must be a valid UUID' })
  createdBy: string;
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
