/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { BotStatsType } from '../schemas/bot-stats.schema';
import { IsLessThanDate } from '../validation-rules/is-less-than-date';

export class BotStatsCreateDto {
  @IsNotEmpty()
  @IsString()
  type: BotStatsType;

  @IsString()
  @IsNotEmpty()
  day: Date;

  @IsNotEmpty()
  @IsNumber()
  value: number;

  @IsString()
  @IsNotEmpty()
  name: string;
}

export class BotStatsFindDto {
  /**
   * Start date for message retrieval.
   */
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @IsLessThanDate('to', {
    message: 'From date must be less than or equal to To date',
  })
  from?: Date;

  /**
   * End date for message retrieval.
   */
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  to?: Date;
}

export class BotStatsFindDatumDto extends BotStatsFindDto {
  /**
   * Type for message to retrieve.
   */
  @IsEnum(BotStatsType)
  @IsNotEmpty()
  type: BotStatsType;
}
