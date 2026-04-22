/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  messageFullSchema,
  messageSchema,
  messageStubSchema,
  type Message,
  type MessageFull,
  type MessageStub,
} from '@hexabot-ai/types';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import { Validate } from '@/utils/decorators/validate.decorator';
import { TDto } from '@/utils/types/dto.types';

import {
  StdIncomingMessage,
  StdOutgoingMessage,
  validMessageTextSchema,
} from '../types/message';

export { messageFullSchema, messageSchema, messageStubSchema };

export type { Message, MessageFull, MessageStub };

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
  @IsUUIDv4({ message: 'Sender must be a valid UUID' })
  sender?: string;

  @ApiPropertyOptional({ description: 'Message recipient', type: String })
  @IsString()
  @IsOptional()
  @IsUUIDv4({ message: 'Recipient must be a valid UUID' })
  recipient?: string;

  @ApiPropertyOptional({ description: 'Message sent by', type: String })
  @IsString()
  @IsOptional()
  @IsUUIDv4({ message: 'SentBy must be a valid UUID' })
  sentBy?: string;

  @ApiProperty({ description: 'Message thread', type: String })
  @IsString()
  @IsUUIDv4({ message: 'Thread must be a valid UUID' })
  thread!: string;

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

export type MessageDto = TDto<
  {
    plain: typeof messageSchema;
    full: typeof messageFullSchema;
  },
  {
    create: MessageCreateDto;
    update: MessageUpdateDto;
  }
>;
