/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseOrmController } from '@/utils/generics/base-orm.controller';

import { DummyOrmEntity } from '../entities/dummy.entity';
import { DummyService } from '../services/dummy.service';

@Injectable()
export class DummyController extends BaseOrmController<DummyOrmEntity> {
  constructor(protected readonly service: DummyService) {
    super(service);
  }
}
