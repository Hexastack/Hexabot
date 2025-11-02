/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import { Attachment } from '@/attachment/dto/attachment.dto';
import { ChannelName } from '@/channel/types';
import { User } from '@/user/dto/user.dto';
import { Validate } from '@/utils/decorators/validate.decorator';
import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';

import { channelDataSchema, SubscriberChannelData } from '../types/channel';
import { SubscriberContext } from '../types/subscriberContext';

import { Label } from './label.dto';

@Exclude()
export class SubscriberStub extends BaseStub {
  @Expose()
  first_name!: string;

  @Expose()
  last_name!: string;

  @Expose()
  locale: string | null;

  @Expose()
  timezone: number = 0;

  @Expose()
  language: string | null;

  @Expose()
  gender: string | null;

  @Expose()
  country: string | null;

  @Expose()
  foreign_id: string;

  @Expose()
  assignedAt: Date | null;

  @Expose()
  lastvisit: Date | null;

  @Expose()
  retainedFrom: Date | null;

  @Expose()
  channel!: SubscriberChannelData<ChannelName>;

  @Expose()
  context!: SubscriberContext;
}

@Exclude()
export class Subscriber extends SubscriberStub {
  @Expose({ name: 'labelIds' })
  labels!: string[];

  @Expose({ name: 'assignedToId' })
  assignedTo: string | null;

  @Expose({ name: 'avatarId' })
  avatar: string | null;
}

@Exclude()
export class SubscriberFull extends SubscriberStub {
  @Expose()
  @Type(() => Label)
  labels!: Label[];

  @Expose()
  @Type(() => User)
  assignedTo: User | null;

  @Expose()
  @Type(() => Attachment)
  avatar: Attachment | null;
}

export class SubscriberCreateDto {
  @ApiProperty({ description: 'Subscriber first name', type: String })
  @IsNotEmpty()
  @IsString()
  first_name: string;

  @ApiProperty({ description: 'Subscriber last name', type: String })
  @IsNotEmpty()
  @IsString()
  last_name: string;

  @ApiPropertyOptional({ description: 'Subscriber locale', type: String })
  @IsOptional()
  @IsString()
  locale: string | null;

  @ApiPropertyOptional({ description: 'Subscriber timezone', type: Number })
  @IsOptional()
  @IsNumber()
  timezone: number;

  @ApiPropertyOptional({ description: 'Subscriber language', type: String })
  @IsNotEmpty()
  @IsString()
  language: string | null;

  @ApiPropertyOptional({ description: 'Subscriber gender', type: String })
  @IsOptional()
  @IsString()
  gender: string | null;

  @ApiPropertyOptional({ description: 'Subscriber country', type: String })
  @IsOptional()
  @IsString()
  country: string | null;

  @ApiPropertyOptional({ description: 'Subscriber foreign id', type: String })
  @IsOptional()
  @IsString()
  foreign_id: string;

  @ApiProperty({ description: 'Subscriber labels', type: Array })
  @IsNotEmpty()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Label must be a valid UUID' })
  labels: string[];

  @ApiPropertyOptional({
    description: 'Subscriber assigned to',
    type: String,
    default: null,
  })
  @IsOptional()
  @IsString()
  @IsUUID('4', { message: 'AssignedTo must be a valid UUID' })
  assignedTo: string | null = null;

  @ApiPropertyOptional({
    description: 'Subscriber assigned at',
    type: Date,
    default: null,
  })
  @IsOptional()
  @IsDate()
  assignedAt: Date | null;

  @ApiPropertyOptional({
    description: 'Subscriber last visit',
    type: Date,
  })
  @IsOptional()
  @IsDate()
  lastvisit: Date | null;

  @ApiPropertyOptional({
    description: 'Subscriber retained from',
    type: Date,
  })
  @IsOptional()
  @IsDate()
  retainedFrom: Date | null;

  @ApiProperty({
    description: 'Subscriber channel',
    type: Object,
  })
  @IsNotEmpty()
  @Validate(channelDataSchema)
  channel: SubscriberChannelData<ChannelName>;

  @ApiPropertyOptional({
    description: 'Subscriber Avatar',
    type: String,
    default: null,
  })
  @IsOptional()
  @IsString()
  @IsUUID('4', { message: 'Avatar Attachment ID must be a valid UUID' })
  avatar: string | null = null;

  @ApiPropertyOptional({ description: 'Context', type: Object })
  @IsOptional()
  @IsObject()
  context: SubscriberContext;
}

export class SubscriberUpdateDto extends PartialType(SubscriberCreateDto) {}

export type SubscriberTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof Subscriber;
  FullCls: typeof SubscriberFull;
}>;

export type SubscriberDtoConfig = DtoActionConfig<{
  create: SubscriberCreateDto;
  update: SubscriberUpdateDto;
}>;

export type SubscriberDto = SubscriberDtoConfig;
