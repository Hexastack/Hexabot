/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { coerceUser, type User } from '@hexabot-ai/types';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  Exclude,
  Expose,
  plainToInstance,
  Transform,
  Type,
} from 'class-transformer';
import {
  IsDate,
  IsDefined,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { Subscriber } from '@/chat/dto/subscriber.dto';
import { Thread } from '@/chat/dto/thread.dto';
import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import { BaseStub, TDto } from '@/utils/types/dto.types';

import type { MemoryValue } from '../types';

import { MemoryDefinition } from './memory-definition.dto';
import { WorkflowRun } from './workflow-run.dto';
import { Workflow } from './workflow.dto';

const toOwnerProfile = (value: unknown): Subscriber | User => {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    ('username' in value ||
      'email' in value ||
      'sendEmail' in value ||
      'roles' in value ||
      'roleIds' in value)
  ) {
    return coerceUser(value);
  }

  return plainToInstance(Subscriber, value, {
    exposeUnsetFields: false,
  });
};

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

  @Expose({ name: 'threadId' })
  @Transform(({ value }) => (value == null ? undefined : value))
  thread?: string | null;
}

@Exclude()
export class MemoryRecordFull extends MemoryRecordStub {
  @Expose()
  @Type(() => MemoryDefinition)
  definition!: MemoryDefinition;

  @Expose()
  @Transform(({ value }) => (value == null ? value : toOwnerProfile(value)))
  owner!: Subscriber | User;

  @Expose()
  @Type(() => Workflow)
  workflow?: Workflow | null;

  @Expose()
  @Type(() => WorkflowRun)
  run?: WorkflowRun | null;

  @Expose()
  @Type(() => Thread)
  thread?: Thread | null;
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

  @ApiPropertyOptional({
    description: 'Thread id when scope is thread',
    type: String,
  })
  @IsOptional()
  @IsString()
  @IsUUIDv4({ message: 'thread must be a valid UUID' })
  thread?: string | null;

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

export type MemoryRecordDto = TDto<
  {
    plain: typeof MemoryRecord;
    full: typeof MemoryRecordFull;
  },
  {
    create: MemoryRecordCreateDto;
    update: MemoryRecordUpdateDto;
  }
>;
