/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Injectable } from '@nestjs/common';

import { BaseService } from '@/utils/generics/base-service';

import { DummyRepository } from '../repositories/dummy.repository';
import { Dummy } from '../schemas/dummy.schema';

@Injectable()
export class DummyService extends BaseService<Dummy> {
  constructor(readonly repository: DummyRepository) {
    super(repository);
  }
}
