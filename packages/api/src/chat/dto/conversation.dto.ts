/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@hexabot/core/database';
import { IsUUIDv4 } from '@hexabot/core/decorators';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

import { Context } from './../types/context';
import { Block } from './block.dto';
import { Subscriber } from './subscriber.dto';

@Exclude()
export class ConversationStub extends BaseStub {
  @Expose()
  active!: boolean;

  @Expose()
  context!: Context;
}

@Exclude()
export class Conversation extends ConversationStub {
  @Expose({ name: 'senderId' })
  sender!: string;

  @Expose({ name: 'currentBlockId' })
  @Transform(({ value }) => (value == null ? undefined : value))
  current?: string | null;

  @Expose({ name: 'nextBlockIds' })
  next!: string[];
}

@Exclude()
export class ConversationFull extends ConversationStub {
  @Expose()
  @Type(() => Subscriber)
  sender!: Subscriber;

  @Expose()
  @Type(() => Block)
  current: Block;

  @Expose()
  @Type(() => Block)
  next!: Block[];
}

export class ConversationCreateDto {
  @ApiProperty({ description: 'Conversation sender', type: String })
  @IsNotEmpty()
  @IsString()
  @IsUUIDv4({
    message: 'Sender must be a valid UUID',
  })
  sender: string;

  @ApiPropertyOptional({ description: 'Conversation is active', type: Boolean })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Conversation context', type: Object })
  @IsOptional()
  @IsObject()
  context?: Context;

  @ApiProperty({ description: 'Current conversation', type: String })
  @IsOptional()
  @IsString()
  @IsUUIDv4({
    message: 'Current must be a valid UUID',
  })
  current?: string | null;

  @ApiProperty({ description: 'next conversation', type: Array })
  @IsOptional()
  @IsArray()
  @IsUUIDv4({
    each: true,
    message: 'next must be a valid UUID',
  })
  next?: string[];
}

export type ConversationTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof Conversation;
  FullCls: typeof ConversationFull;
}>;

export class ConversationUpdateDto extends PartialType(ConversationCreateDto) {}

export type ConversationDtoConfig = DtoActionConfig<{
  create: ConversationCreateDto;
  update: ConversationUpdateDto;
}>;

export type ConversationDto = ConversationDtoConfig;
