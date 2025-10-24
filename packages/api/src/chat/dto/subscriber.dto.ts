/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { ChannelName } from '@/channel/types';
import { Validate } from '@/utils/decorators/validate.decorator';
import { DtoActionConfig } from '@/utils/types/dto.types';
import { IsObjectId } from '@/utils/validation-rules/is-object-id';

import { channelDataSchema, SubscriberChannelData } from '../types/channel';

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
  locale?: string;

  @ApiPropertyOptional({ description: 'Subscriber timezone', type: Number })
  @IsOptional()
  @IsNumber()
  timezone?: number;

  @ApiPropertyOptional({ description: 'Subscriber language', type: String })
  @IsNotEmpty()
  @IsString()
  language: string;

  @ApiPropertyOptional({ description: 'Subscriber gender', type: String })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ description: 'Subscriber country', type: String })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Subscriber foreign id', type: String })
  @IsOptional()
  @IsString()
  foreign_id?: string;

  @ApiProperty({ description: 'Subscriber labels', type: Array })
  @IsNotEmpty()
  @IsArray()
  @IsObjectId({ each: true, message: 'Label must be a valid ObjectId' })
  labels: string[];

  @ApiPropertyOptional({
    description: 'Subscriber assigned to',
    type: String,
    default: null,
  })
  @IsOptional()
  @IsString()
  @IsObjectId({ message: 'AssignedTo must be a valid ObjectId' })
  assignedTo?: string | null;

  @ApiPropertyOptional({
    description: 'Subscriber assigned at',
    type: Date,
    default: null,
  })
  @IsOptional()
  @IsDate()
  assignedAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Subscriber last visit',
    type: Date,
  })
  @IsOptional()
  @IsDate()
  lastvisit?: Date;

  @ApiPropertyOptional({
    description: 'Subscriber retained from',
    type: Date,
  })
  @IsOptional()
  @IsDate()
  retainedFrom?: Date;

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
  @IsObjectId({ message: 'Avatar Attachment ID must be a valid ObjectId' })
  avatar?: string | null = null;
}

export class SubscriberUpdateDto extends PartialType(SubscriberCreateDto) {}

export type SubscriberDto = DtoActionConfig<{
  create: SubscriberCreateDto;
}>;
