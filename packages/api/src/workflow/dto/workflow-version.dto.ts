/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { coerceUser, type User } from '@hexabot-ai/types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import { BaseStub, TDto } from '@/utils/types/dto.types';

import { IsWorkflowYaml } from '../decorators/is-workflow-yaml.decorator';
import { WorkflowVersionAction } from '../types';

import { Workflow } from './workflow.dto';

@Exclude()
export class WorkflowVersionStub extends BaseStub {
  @Expose()
  version!: number;

  @Expose()
  definitionYml!: string;

  @Expose()
  checksum!: string;

  @Expose()
  message?: string | null;

  @Expose()
  action?: WorkflowVersionAction | null;
}

@Exclude()
export class WorkflowVersion extends WorkflowVersionStub {
  @Expose({ name: 'parentVersionId' })
  parentVersion?: string | null;

  @Expose({ name: 'workflowId' })
  workflow!: string;

  @Expose({ name: 'createdById' })
  createdBy: string | null;
}

@Exclude()
export class WorkflowVersionFull extends WorkflowVersionStub {
  @Expose()
  @Type(() => WorkflowVersion)
  parentVersion!: WorkflowVersion;

  @Expose()
  @Type(() => Workflow)
  workflow!: Workflow;

  @Expose()
  @Transform(({ value }) => (value == null ? value : coerceUser(value)))
  createdBy: User | null;
}

export class WorkflowNewVersionDto {
  @ApiPropertyOptional({
    description: 'Workflow version action',
    enumName: 'WorkflowVersionAction',
    enum: WorkflowVersionAction,
  })
  @IsEnum(WorkflowVersionAction)
  action: WorkflowVersionAction;

  @ApiProperty({ description: 'Workflow to execute', type: String })
  @IsOptional()
  @IsUUIDv4({
    message: 'Workflow must be a valid UUID',
  })
  workflow: string;

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

  @ApiProperty({ description: 'Workflow version creator', type: String })
  @IsOptional()
  @IsUUIDv4({
    message: 'createdBy must be a valid UUID',
  })
  createdBy: string;

  @ApiProperty({ description: 'Parent version ID', type: String })
  @IsOptional()
  @IsUUIDv4({
    message: 'Parent version must be a valid UUID',
  })
  parentVersion?: string | null;
}

export class WorkflowVersionCreateDto extends WorkflowNewVersionDto {
  @ApiProperty({ description: 'Workflow version', type: String })
  @IsNumber({ allowInfinity: false, allowNaN: false })
  version: number;
}

export class WorkflowVersionUpdateDto {
  @ApiPropertyOptional({
    description: 'Workflow version message',
    type: String,
  })
  @IsOptional()
  @IsString()
  message?: string;
}

export class WorkflowVersionRestoreDto {
  @ApiPropertyOptional({
    description: 'Optional message for the restored version',
    type: String,
  })
  @IsOptional()
  @IsString()
  message?: string;
}

export type WorkflowVersionDto = TDto<
  {
    plain: typeof WorkflowVersion;
    full: typeof WorkflowVersionFull;
  },
  {
    create: WorkflowVersionCreateDto;
    update: WorkflowVersionUpdateDto;
  }
>;
