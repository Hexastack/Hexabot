/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsObject,
  IsOptional,
  MaxLength,
  IsNotEmpty,
  IsString,
} from 'class-validator';

import { ObjectIdDto } from '@/utils/dto/object-id.dto';

export class AttachmentCreateDto {
  /**
   * Attachment channel
   */
  @ApiPropertyOptional({ description: 'Attachment channel', type: Object })
  @IsNotEmpty()
  @IsObject()
  channel?: Partial<Record<string, any>>;

  /**
   * Attachment location
   */
  @ApiProperty({ description: 'Attachment location', type: String })
  @IsNotEmpty()
  @IsString()
  location: string;

  /**
   * Attachment name
   */
  @ApiProperty({ description: 'Attachment name', type: String })
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * Attachment size
   */
  @ApiProperty({ description: 'Attachment size', type: Number })
  @IsNotEmpty()
  size: number;

  /**
   * Attachment type
   */
  @ApiProperty({ description: 'Attachment type', type: String })
  @IsNotEmpty()
  @IsString()
  type: string;
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
