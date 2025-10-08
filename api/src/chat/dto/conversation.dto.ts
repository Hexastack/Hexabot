/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

import { DtoConfig } from '@/utils/types/dto.types';
import { IsObjectId } from '@/utils/validation-rules/is-object-id';

import { Context } from './../schemas/types/context';

export class ConversationCreateDto {
  @ApiProperty({ description: 'Conversation sender', type: String })
  @IsNotEmpty()
  @IsString()
  @IsObjectId({
    message: 'Sender must be a valid objectId',
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
  @IsObjectId({
    message: 'Current must be a valid objectId',
  })
  current?: string | null;

  @ApiProperty({ description: 'next conversation', type: Array })
  @IsOptional()
  @IsArray()
  @IsObjectId({
    each: true,
    message: 'next must be a valid objectId',
  })
  next?: string[];
}

export type ConversationDto = DtoConfig<{
  create: ConversationCreateDto;
}>;
