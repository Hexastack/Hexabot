/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmRepository } from '@hexabot/core/database';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { Dummy, DummyDtoConfig, DummyTransformerDto } from '../dto/dummy.dto';
import { DummyOrmEntity } from '../entities/dummy.entity';

@Injectable()
export class DummyRepository extends BaseOrmRepository<
  DummyOrmEntity,
  DummyTransformerDto,
  DummyDtoConfig
> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(DummyOrmEntity), [], {
      PlainCls: Dummy,
      FullCls: Dummy,
    });
  }
}
