/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Type } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

export class ObjectIdDto {
  @Type(() => Types.ObjectId)
  @IsNotEmpty({ message: 'Invalid ObjectId' })
  id: string;
}
