/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
