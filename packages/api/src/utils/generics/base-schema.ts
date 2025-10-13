/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Transform, Type, Expose } from 'class-transformer';

export abstract class BaseSchema {
  @Expose()
  @Transform(({ obj }) => {
    // We have to return an id for unit test purpose
    return obj._id ? obj._id.toString() : obj.id;
  })
  public readonly id: string;

  @Type(() => Date)
  public readonly createdAt: Date;

  @Type(() => Date)
  public readonly updatedAt: Date;
}
