/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowDefinition } from '@hexabot-ai/agentic';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
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
export class Workflow extends WorkflowStub {
  @Expose({ name: 'createdById' })
  createdBy?: string | null;
}

@Exclude()
export class WorkflowFull extends WorkflowStub {
  @Expose()
  @Type(() => User)
  createdBy?: User | null;
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

  @ApiProperty({ description: 'Workflow definition', type: Object })
  @IsNotEmpty()
  @IsObject()
  definition!: WorkflowDefinition;
}

export class WorkflowCreateDto extends WorkflowNewDto {
  @ApiPropertyOptional({ description: 'Workflow creator', type: String })
  @IsOptional()
  @IsUUIDv4({
    message: 'createdBy must be a valid UUID',
  })
  createdBy?: string | null;
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
