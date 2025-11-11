/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseOrmSeeder } from '@/utils/generics/base-orm.seeder';

import {
  ContextVarDtoConfig,
  ContextVarTransformerDto,
} from '../dto/context-var.dto';
import { ContextVarOrmEntity } from '../entities/context-var.entity';
import { ContextVarRepository } from '../repositories/context-var.repository';

@Injectable()
export class ContextVarSeeder extends BaseOrmSeeder<
  ContextVarOrmEntity,
  ContextVarTransformerDto,
  ContextVarDtoConfig
> {
  constructor(private readonly contextVarRepository: ContextVarRepository) {
    super(contextVarRepository);
  }
}
