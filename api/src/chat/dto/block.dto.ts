/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

import { IsObjectId } from '@/utils/validation-rules/is-object-id';

import { CaptureVar } from '../schemas/types/capture-var';
import { BlockMessage } from '../schemas/types/message';
import { BlockOptions } from '../schemas/types/options';
import { Pattern } from '../schemas/types/pattern';
import { Position } from '../schemas/types/position';
import { IsMessage } from '../validation-rules/is-message';
import { IsPatternList } from '../validation-rules/is-pattern-list';
import { IsPosition } from '../validation-rules/is-position';
import { IsVarCapture } from '../validation-rules/is-valid-capture';

export class BlockCreateDto {
  @ApiProperty({ description: 'Block name', type: String })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Block patterns', type: Array })
  @IsOptional()
  @IsPatternList({ message: 'Patterns list is invalid' })
  patterns?: Pattern[] = [];

  @ApiPropertyOptional({ description: 'Block trigger labels', type: Array })
  @IsOptional()
  @IsArray()
  @IsObjectId({ each: true, message: 'Trigger label must be a valid objectId' })
  trigger_labels?: string[] = [];

  @ApiPropertyOptional({ description: 'Block assign labels', type: Array })
  @IsOptional()
  @IsArray()
  @IsObjectId({ each: true, message: 'Assign label must be a valid objectId' })
  assign_labels?: string[] = [];

  @ApiPropertyOptional({ description: 'Block trigger channels', type: Array })
  @IsOptional()
  @IsArray()
  trigger_channels?: string[] = [];

  @ApiPropertyOptional({ description: 'Block options', type: Object })
  @IsOptional()
  @IsObject()
  options?: BlockOptions;

  @ApiProperty({ description: 'Block message', type: Object })
  @IsNotEmpty()
  @IsMessage({ message: 'Message is invalid' })
  message: BlockMessage;

  @ApiPropertyOptional({ description: 'next blocks', type: Array })
  @IsOptional()
  @IsArray()
  @IsObjectId({ each: true, message: 'Next block must be a valid objectId' })
  nextBlocks?: string[];

  @ApiPropertyOptional({ description: 'attached blocks', type: String })
  @IsOptional()
  @IsString()
  @IsObjectId({
    message: 'Attached block must be a valid objectId',
  })
  attachedBlock?: string;

  @ApiProperty({ description: 'Block category', type: String })
  @IsNotEmpty()
  @IsString()
  @IsObjectId({ message: 'Category must be a valid objectId' })
  category: string;

  @ApiPropertyOptional({
    description: 'Block has started conversation',
    type: Boolean,
  })
  @IsBoolean()
  @IsOptional()
  starts_conversation?: boolean;

  @ApiPropertyOptional({
    description: 'Block capture vars',
    type: Array,
  })
  @IsOptional()
  @IsVarCapture({ message: 'Capture vars are invalid' })
  capture_vars?: CaptureVar[];

  @ApiProperty({
    description: 'Block position',
    type: Object,
  })
  @IsNotEmpty()
  @IsPosition({ message: 'Position is invalid' })
  position: Position;
}

export class BlockUpdateDto extends PartialType(
  OmitType(BlockCreateDto, [
    'patterns',
    'trigger_labels',
    'assign_labels',
    'trigger_channels',
  ]),
) {
  @ApiPropertyOptional({ description: 'Block patterns', type: Array })
  @IsOptional()
  @IsPatternList({ message: 'Patterns list is invalid' })
  patterns?: Pattern[];

  @ApiPropertyOptional({ description: 'Block trigger labels', type: Array })
  @IsOptional()
  @IsArray()
  @IsObjectId({ each: true, message: 'Trigger label must be a valid objectId' })
  trigger_labels?: string[];

  @ApiPropertyOptional({ description: 'Block assign labels', type: Array })
  @IsOptional()
  @IsArray()
  @IsObjectId({ each: true, message: 'Assign label must be a valid objectId' })
  assign_labels?: string[];

  @ApiPropertyOptional({ description: 'Block trigger channels', type: Array })
  @IsArray()
  @IsOptional()
  trigger_channels?: string[];
}
