/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  threadFullSchema,
  threadSchema,
  threadStubSchema,
  type Thread,
  type ThreadFull,
  type ThreadStub,
} from '@hexabot-ai/types';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional, IsString } from 'class-validator';

import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import { TDto } from '@/utils/types/dto.types';

import {
  THREAD_CLOSE_REASONS,
  THREAD_STATUSES,
} from '../entities/thread.entity';

export { threadFullSchema, threadSchema, threadStubSchema };

export type { Thread, ThreadFull, ThreadStub };

export class ThreadCreateDto {
  @ApiProperty({ description: 'Owner subscriber id', type: String })
  @IsString()
  @IsUUIDv4({ message: 'Subscriber must be a valid UUID' })
  subscriber!: string;

  @ApiPropertyOptional({
    description: 'Thread status',
    enum: THREAD_STATUSES,
  })
  @IsOptional()
  @IsIn(THREAD_STATUSES)
  status?: 'open' | 'closed';

  @ApiPropertyOptional({
    description: 'Thread display title',
    type: String,
  })
  @IsOptional()
  @IsString()
  title?: string | null;

  @ApiPropertyOptional({
    description: 'Timestamp of the latest thread message',
    type: Date,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastMessageAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Timestamp when thread was closed',
    type: Date,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  closedAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Reason why thread was closed',
    enum: THREAD_CLOSE_REASONS,
  })
  @IsOptional()
  @IsIn(THREAD_CLOSE_REASONS)
  closeReason?: 'manual' | 'inactivity' | null;
}

export class ThreadUpdateDto extends PartialType(ThreadCreateDto) {}

export type ThreadDto = TDto<
  {
    plain: typeof threadSchema;
    full: typeof threadFullSchema;
  },
  {
    create: ThreadCreateDto;
    update: ThreadUpdateDto;
  }
>;
