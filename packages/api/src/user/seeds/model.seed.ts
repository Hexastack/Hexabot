/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseOrmSeeder } from '@/utils/generics/base-orm.seeder';

import { ModelDtoConfig, ModelTransformerDto } from '../dto/model.dto';
import { ModelOrmEntity } from '../entities/model.entity';
import { ModelRepository } from '../repositories/model.repository';

@Injectable()
export class ModelSeeder extends BaseOrmSeeder<
  ModelOrmEntity,
  ModelTransformerDto,
  ModelDtoConfig
> {
  constructor(private readonly modelRepository: ModelRepository) {
    super(modelRepository);
  }
}
