/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { coerceAttachment, type Attachment } from '@hexabot-ai/types';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { ChannelName } from '@/channel/types';
import { UserProfileAssignedStub } from '@/user/dto/assigned-profile.dto';
import {
  UserProfileCreateDto,
  UserProfileStub,
} from '@/user/dto/user-profile.dto';
import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import { Validate } from '@/utils/decorators/validate.decorator';
import { TDto } from '@/utils/types/dto.types';

import { channelDataSchema, SubscriberChannelData } from '../types/channel';

import { Label } from './label.dto';

@Exclude()
export class SubscriberStub extends UserProfileStub {
  @Expose()
  locale: string | null;

  @Expose()
  gender: string | null;

  @Expose()
  country: string | null;

  @Expose()
  foreignId: string;

  @Expose()
  assignedAt: Date | null;

  @Expose()
  lastvisit: Date | null;

  @Expose()
  retainedFrom: Date | null;

  @Expose()
  channel!: SubscriberChannelData<ChannelName>;
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
  @Type(() => UserProfileAssignedStub)
  assignedTo: UserProfileAssignedStub | null;

  @Expose()
  @Transform(({ value }) => (value == null ? value : coerceAttachment(value)))
  avatar: Attachment | null;
}

export class SubscriberCreateDto extends UserProfileCreateDto {
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
  language?: string | null;

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
  foreignId: string;

  @ApiProperty({ description: 'Subscriber labels', type: Array })
  @IsArray()
  @IsUUIDv4({ each: true, message: 'Label must be a valid UUID' })
  labels: string[];

  @ApiPropertyOptional({
    description: 'Subscriber assigned to',
    type: String,
    default: null,
  })
  @IsOptional()
  @IsString()
  @IsUUIDv4({ message: 'AssignedTo must be a valid UUID' })
  assignedTo: string | null;

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
  @IsUUIDv4({ message: 'Avatar Attachment ID must be a valid UUID' })
  avatar: string | null;
}

export class SubscriberUpdateDto extends PartialType(SubscriberCreateDto) {}

export type SubscriberDto = TDto<
  {
    plain: typeof Subscriber;
    full: typeof SubscriberFull;
  },
  {
    create: SubscriberCreateDto;
    update: SubscriberUpdateDto;
  }
>;
