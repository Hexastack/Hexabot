/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowDefinition } from '@hexabot-ai/agentic';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';

import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';

@Exclude()
export class WorkflowStub extends BaseStub {
  @Expose()
  name!: string;

  @Expose()
  version!: string;

  @Expose()
  description?: string | null;

  @Expose()
  definition!: WorkflowDefinition;

  @Expose()
  source?: string | null;
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

  @ApiProperty({ description: 'Workflow definition', type: Object })
  @IsNotEmpty()
  @IsObject()
  definition!: WorkflowDefinition;

  @ApiPropertyOptional({
    description: 'Workflow source (YAML or JSON string)',
    type: String,
  })
  @IsOptional()
  @IsString()
  source?: string;
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
