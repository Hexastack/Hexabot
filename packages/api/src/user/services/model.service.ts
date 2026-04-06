/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseOrmService } from '@/utils/generics/base-orm.service';

import { ModelOrmEntity } from '../entities/model.entity';
import { ModelRepository } from '../repositories/model.repository';

@Injectable()
export class ModelService extends BaseOrmService<ModelOrmEntity> {
  constructor(readonly repository: ModelRepository) {
    super(repository);
  }
}
