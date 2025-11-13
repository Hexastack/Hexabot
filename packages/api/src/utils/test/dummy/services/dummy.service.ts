/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmService } from '@hexabot/core/database';
import { Injectable } from '@nestjs/common';

import { DummyDtoConfig, DummyTransformerDto } from '../dto/dummy.dto';
import { DummyOrmEntity } from '../entities/dummy.entity';
import { DummyRepository } from '../repositories/dummy.repository';

@Injectable()
export class DummyService extends BaseOrmService<
  DummyOrmEntity,
  DummyTransformerDto,
  DummyDtoConfig,
  DummyRepository
> {
  constructor(readonly repository: DummyRepository) {
    super(repository);
  }
}
