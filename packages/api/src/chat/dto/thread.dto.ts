/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional, IsString } from 'class-validator';

import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import { BaseStub, TDto } from '@/utils/types/dto.types';

import {
  THREAD_CLOSE_REASONS,
  THREAD_STATUSES,
} from '../entities/thread.entity';

import { Subscriber } from './subscriber.dto';

@Exclude()
export class ThreadStub extends BaseStub {
  @Expose()
  status!: 'open' | 'closed';

  @Expose()
  @Transform(({ value }) => (value == null ? undefined : value))
  lastMessageAt?: Date | null;

  @Expose()
  @Transform(({ value }) => (value == null ? undefined : value))
  closedAt?: Date | null;

  @Expose()
  @Transform(({ value }) => (value == null ? undefined : value))
  closeReason?: 'manual' | 'inactivity' | null;

  @Expose()
  @Transform(({ value }) => (value == null ? undefined : value))
  title?: string | null;
}

@Exclude()
export class Thread extends ThreadStub {
  @Expose({ name: 'subscriberId' })
  subscriber!: string;
}

@Exclude()
export class ThreadFull extends ThreadStub {
  @Expose()
  @Type(() => Subscriber)
  subscriber!: Subscriber;
}

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
    plain: typeof Thread;
    full: typeof ThreadFull;
  },
  {
    create: ThreadCreateDto;
    update: ThreadUpdateDto;
  }
>;
