/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

import { Validate } from '@/utils/decorators/validate.decorator';
import { IsObjectId } from '@/utils/validation-rules/is-object-id';

import {
  StdIncomingMessage,
  StdOutgoingMessage,
  validMessageTextSchema,
} from '../schemas/types/message';

export class MessageCreateDto {
  @ApiProperty({ description: 'Message id', type: String })
  @IsOptional()
  @IsString()
  mid?: string;

  @ApiProperty({ description: 'Reply to Message id', type: String })
  @IsOptional()
  @IsString()
  inReplyTo?: string;

  @ApiPropertyOptional({ description: 'Message sender', type: String })
  @IsString()
  @IsOptional()
  @IsObjectId({ message: 'Sender must be a valid ObjectId' })
  sender?: string;

  @ApiPropertyOptional({ description: 'Message recipient', type: String })
  @IsString()
  @IsOptional()
  @IsObjectId({ message: 'Recipient must be a valid ObjectId' })
  recipient?: string;

  @ApiPropertyOptional({ description: 'Message sent by', type: String })
  @IsString()
  @IsOptional()
  @IsObjectId({ message: 'SentBy must be a valid ObjectId' })
  sentBy?: string;

  @ApiProperty({ description: 'Message', type: Object })
  @IsObject()
  @IsNotEmpty()
  @Validate(validMessageTextSchema)
  message: StdOutgoingMessage | StdIncomingMessage;

  @ApiPropertyOptional({ description: 'Message is read', type: Boolean })
  @IsBoolean()
  @IsNotEmpty()
  @IsOptional()
  read?: boolean;

  @ApiPropertyOptional({ description: 'Message is delivered', type: Boolean })
  @IsBoolean()
  @IsNotEmpty()
  @IsOptional()
  delivery?: boolean;

  @ApiPropertyOptional({ description: 'Message is handed over', type: Boolean })
  @IsBoolean()
  @IsOptional()
  handover?: boolean;
}

export class MessageUpdateDto extends PartialType(MessageCreateDto) {}
