/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmRepository } from '@hexabot/core/database';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Model,
  ModelDtoConfig,
  ModelFull,
  ModelTransformerDto,
} from '../dto/model.dto';
import { ModelOrmEntity } from '../entities/model.entity';

@Injectable()
export class ModelRepository extends BaseOrmRepository<
  ModelOrmEntity,
  ModelTransformerDto,
  ModelDtoConfig
> {
  constructor(
    @InjectRepository(ModelOrmEntity)
    repository: Repository<ModelOrmEntity>,
  ) {
    super(repository, ['permissions'], { PlainCls: Model, FullCls: ModelFull });
  }
}
