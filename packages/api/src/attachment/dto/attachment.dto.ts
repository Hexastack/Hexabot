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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsIn,
  IsMimeType,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { ChannelName } from '@/channel/types';
import { User } from '@/user/dto/user.dto';

import {
  AttachmentAccess,
  AttachmentCreatedByRef,
  AttachmentResourceRef,
} from '../types';

@Exclude()
export class AttachmentStub extends BaseStub {
  @Expose()
  name!: string;

  @Expose()
  type!: string;

  @Expose()
  size!: number;

  @Expose()
  location!: string;

  @Expose()
  channel?: Partial<Record<ChannelName, any>>;

  @Expose()
  createdByRef?: AttachmentCreatedByRef;

  @Expose()
  resourceRef!: AttachmentResourceRef;

  @Expose()
  access!: AttachmentAccess;

  @Expose()
  url: string;
}

@Exclude()
export class Attachment extends AttachmentStub {
  @Expose()
  createdBy?: string | null;
}

@Exclude()
export class AttachmentFull extends AttachmentStub {
  @Expose()
  @Type(() => User)
  createdBy: User | undefined;
}

export class AttachmentMetadataDto {
  /**
   * Attachment original file name
   */
  @ApiProperty({ description: 'Attachment original file name', type: String })
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * Attachment size in bytes
   */
  @ApiProperty({ description: 'Attachment size in bytes', type: Number })
  @IsNotEmpty()
  @IsNumber()
  size: number;

  /**
   * Attachment MIME type
   */
  @ApiProperty({ description: 'Attachment MIME type', type: String })
  @IsNotEmpty()
  @IsString()
  @IsMimeType()
  type: string;

  /**
   * Attachment specia channel(s) metadata
   */
  @ApiPropertyOptional({ description: 'Attachment channel', type: Object })
  @IsNotEmpty()
  @IsObject()
  channel?: Partial<Record<ChannelName, any>>;

  /**
   * Attachment resource reference
   */
  @ApiProperty({
    description: 'Attachment Resource Ref',
    enum: Object.values(AttachmentResourceRef),
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(AttachmentResourceRef))
  resourceRef: AttachmentResourceRef;

  /**
   * Attachment Owner Type
   */
  @ApiProperty({
    description: 'Attachment Owner Type',
    enum: Object.values(AttachmentCreatedByRef),
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(AttachmentCreatedByRef))
  createdByRef: AttachmentCreatedByRef;

  /**
   * Attachment Access
   */
  @ApiProperty({
    description: 'Attachment Access',
    enum: Object.values(AttachmentAccess),
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(AttachmentAccess))
  access: AttachmentAccess;

  /**
   * Attachment Owner : Subscriber or User ID
   */
  @ApiProperty({
    description: 'Attachment Owner : Subscriber / User ID',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @IsUUIDv4({ message: 'CreatedBy must be a valid UUID' })
  createdBy: string;
}

export class AttachmentCreateDto extends AttachmentMetadataDto {
  /**
   * Attachment location (file would/should be stored under a unique name)
   */
  @ApiProperty({ description: 'Attachment location', type: String })
  @IsNotEmpty()
  @IsString()
  location: string;
}

export class AttachmentDownloadDto {
  @ApiPropertyOptional({ description: 'Identifier', type: String })
  @IsUUIDv4({ each: true, message: 'Assign label must be a valid UUID' })
  id: string;

  /**
   * Attachment file name
   */
  @ApiPropertyOptional({
    description: 'Attachment download filename',
    type: String,
  })
  @Type(() => String)
  @MaxLength(255)
  @IsOptional()
  filename?: string;
}

export class AttachmentContextParamDto {
  @ApiProperty({
    description: 'Attachment Resource Reference',
    enum: Object.values(AttachmentResourceRef),
  })
  @IsString()
  @IsIn(Object.values(AttachmentResourceRef))
  @IsNotEmpty()
  resourceRef: AttachmentResourceRef;

  @ApiPropertyOptional({
    description: 'Attachment Access',
    enum: Object.values(AttachmentAccess),
  })
  @IsString()
  @IsIn(Object.values(AttachmentAccess))
  @IsOptional()
  access?: AttachmentAccess;
}

export type AttachmentTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof Attachment;
  FullCls: typeof AttachmentFull;
}>;

export type AttachmentDtoConfig = DtoActionConfig<{
  create: AttachmentCreateDto;
}>;
