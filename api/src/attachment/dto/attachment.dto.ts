/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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
import { ObjectIdDto } from '@/utils/dto/object-id.dto';
import { IsObjectId } from '@/utils/validation-rules/is-object-id';

import {
  AttachmentContext,
  AttachmentOwnerType,
  TAttachmentContext,
  TAttachmentOwnerType,
} from '../types';

export class AttachmentMetadataDto {
  /**
   * Attachment name
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
   * Attachment channel
   */
  @ApiPropertyOptional({ description: 'Attachment channel', type: Object })
  @IsNotEmpty()
  @IsObject()
  channel?: Partial<Record<ChannelName, any>>;

  /**
   * Attachment context
   */
  @ApiPropertyOptional({
    description: 'Attachment Context',
    enum: Object.values(AttachmentContext),
  })
  @IsString()
  @IsIn(Object.values(AttachmentContext))
  context: TAttachmentContext;

  /**
   * Attachment Owner Type
   */
  @ApiPropertyOptional({
    description: 'Attachment Owner Type',
    enum: Object.values(AttachmentOwnerType),
  })
  @IsString()
  @IsIn(Object.values(AttachmentOwnerType))
  ownerType?: TAttachmentOwnerType;

  /**
   * Attachment Owner : Subscriber or User ID
   */
  @ApiPropertyOptional({
    description: 'Attachment Owner : Subscriber / User ID',
    enum: Object.values(AttachmentContext),
  })
  @IsString()
  @IsNotEmpty()
  @IsObjectId({ message: 'Owner must be a valid ObjectId' })
  owner?: string;
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

export class AttachmentDownloadDto extends ObjectIdDto {
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
  @ApiPropertyOptional({
    description: 'Attachment Context',
    enum: Object.values(AttachmentContext),
  })
  @IsString()
  @IsIn(Object.values(AttachmentContext))
  context?: TAttachmentContext;
}
