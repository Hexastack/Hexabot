/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

import { User } from '@/user/dto/user.dto';
import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import { Validate } from '@/utils/decorators/validate.decorator';
import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';

import {
  StdIncomingMessage,
  StdOutgoingMessage,
  validMessageTextSchema,
} from '../types/message';

import { Subscriber } from './subscriber.dto';

@Exclude()
export class MessageStub extends BaseStub {
  @Expose()
  @Transform(({ value }) => (value == null ? undefined : value))
  mid?: string | null;

  @Expose()
  message!: StdOutgoingMessage | StdIncomingMessage;

  @Expose()
  read!: boolean;

  @Expose()
  delivery!: boolean;

  @Expose()
  handover!: boolean;
}

@Exclude()
export class Message extends MessageStub {
  @Expose({ name: 'senderId' })
  sender?: string | null;

  @Expose({ name: 'recipientId' })
  recipient?: string | null;

  @Expose({ name: 'sentById' })
  sentBy?: string | null;
}

@Exclude()
export class MessageFull extends MessageStub {
  @Expose()
  @Type(() => Subscriber)
  sender?: Subscriber | null;

  @Expose()
  @Type(() => Subscriber)
  recipient?: Subscriber | null;

  @Expose()
  @Type(() => User)
  sentBy?: User | null;
}

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

export type MessageTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof Message;
  FullCls: typeof MessageFull;
}>;

export type MessageDtoConfig = DtoActionConfig<{
  create: MessageCreateDto;
  update: MessageUpdateDto;
}>;

export type MessageDto = MessageDtoConfig;
