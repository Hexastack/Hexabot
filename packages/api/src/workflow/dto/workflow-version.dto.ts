/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { User } from '@/user/dto/user.dto';
import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';

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

  @Expose({ name: 'parentVersionId' })
  parentVersionId?: string | null;

  @Expose()
  action?: WorkflowVersionAction | null;
}

@Exclude()
export class WorkflowVersion extends WorkflowVersionStub {
  @Expose({ name: 'workflowId' })
  workflow!: string;

  @Expose({ name: 'createdById' })
  createdBy: string | null;
}

@Exclude()
export class WorkflowVersionFull extends WorkflowVersionStub {
  @Expose()
  @Type(() => Workflow)
  workflow!: Workflow;

  @Expose()
  @Type(() => User)
  createdBy: User | null;
}

export class WorkflowVersionCreateDto {
  @ApiProperty({ description: 'Workflow to execute', type: String })
  @IsNotEmpty()
  @IsUUIDv4({
    message: 'Workflow must be a valid UUID',
  })
  workflow!: string;

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

  @ApiPropertyOptional({
    description: 'Workflow trigger type',
    enumName: 'WorkflowType',
    enum: WorkflowVersionAction,
  })
  @IsEnum(WorkflowVersionAction)
  action: WorkflowVersionAction;

  @ApiProperty({ description: 'Parent version ID', type: String })
  @IsOptional()
  @IsUUIDv4({
    message: 'Parent version must be a valid UUID',
  })
  parentVersionId?: string | null;

  @ApiProperty({ description: 'Workflow version creator', type: String })
  @IsUUIDv4({
    message: 'createdBy must be a valid UUID',
  })
  createdBy?: string | null;
}

export type WorkflowVersionTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof WorkflowVersion;
  FullCls: typeof WorkflowVersionFull;
}>;

export type WorkflowVersionDtoConfig = DtoActionConfig<{}>;

export class WorkflowVersionRestoreDto {
  @ApiPropertyOptional({
    description: 'Optional message for the restored version',
    type: String,
  })
  @IsOptional()
  @IsString()
  message?: string;
}
