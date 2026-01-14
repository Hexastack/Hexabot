/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsDefined,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { Subscriber } from '@/chat/dto/subscriber.dto';
import { User, UserOrmEntity } from '@/user';
import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';

import type { MemoryValue } from '../types';

import { MemoryDefinition } from './memory-definition.dto';
import { WorkflowRun } from './workflow-run.dto';
import { Workflow } from './workflow.dto';

@Exclude()
export class MemoryRecordStub extends BaseStub {
  @Expose()
  value!: MemoryValue;

  @Expose()
  ttlSeconds?: number | null;

  @Expose()
  expiresAt?: Date | null;
}

@Exclude()
export class MemoryRecord extends MemoryRecordStub {
  @Expose({ name: 'definitionId' })
  definition!: string;

  @Expose({ name: 'ownerId' })
  owner!: string;

  @Expose({ name: 'workflowId' })
  @Transform(({ value }) => (value == null ? undefined : value))
  workflow?: string | null;

  @Expose({ name: 'runId' })
  @Transform(({ value }) => (value == null ? undefined : value))
  run?: string | null;
}

@Exclude()
export class MemoryRecordFull extends MemoryRecordStub {
  @Expose()
  @Type(() => MemoryDefinition)
  definition!: MemoryDefinition;

  @Expose()
  @Type((options) =>
    options?.object.owner instanceof UserOrmEntity ? User : Subscriber,
  )
  owner!: Subscriber | User;

  @Expose()
  @Type(() => Workflow)
  workflow?: Workflow | null;

  @Expose()
  @Type(() => WorkflowRun)
  run?: WorkflowRun | null;
}

export class MemoryRecordCreateDto {
  @ApiProperty({
    description: 'Memory definition id',
    type: String,
  })
  @IsString()
  @IsUUIDv4({ message: 'definition must be a valid UUID' })
  definition!: string;

  @ApiPropertyOptional({
    description: 'Owner profile id for user-scoped memory',
    type: String,
  })
  @IsString()
  @IsUUIDv4({ message: 'owner must be a valid UUID' })
  owner: string;

  @ApiPropertyOptional({
    description: 'Workflow id when scope is workflow or run',
    type: String,
  })
  @IsOptional()
  @IsString()
  @IsUUIDv4({ message: 'workflow must be a valid UUID' })
  workflow?: string | null;

  @ApiPropertyOptional({
    description: 'Workflow run id when scope is run',
    type: String,
  })
  @IsOptional()
  @IsString()
  @IsUUIDv4({ message: 'workflowRun must be a valid UUID' })
  run?: string | null;

  @ApiProperty({
    description: 'Memory payload respecting the definition schema',
    type: Object,
  })
  @IsDefined()
  value!: MemoryValue;

  @ApiPropertyOptional({
    description: 'TTL in seconds overriding the definition TTL',
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  ttlSeconds?: number | null;

  @ApiPropertyOptional({
    description: 'Optional expiration date (computed from TTL by default)',
    type: Date,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date | null;
}

export class MemoryRecordUpdateDto extends PartialType(MemoryRecordCreateDto) {}

export type MemoryRecordTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof MemoryRecord;
  FullCls: typeof MemoryRecordFull;
}>;

export type MemoryRecordDtoConfig = DtoActionConfig<{
  create: MemoryRecordCreateDto;
  update: MemoryRecordUpdateDto;
}>;

export type MemoryRecordDto = MemoryRecordDtoConfig;
