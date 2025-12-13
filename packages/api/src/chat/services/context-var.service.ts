/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseOrmService } from '@/utils/generics/base-orm.service';

import {
  ContextVarDtoConfig,
  ContextVarTransformerDto,
} from '../dto/context-var.dto';
import { ContextVarOrmEntity } from '../entities/context-var.entity';
import { ContextVarRepository } from '../repositories/context-var.repository';

@Injectable()
export class ContextVarService extends BaseOrmService<
  ContextVarOrmEntity,
  ContextVarTransformerDto,
  ContextVarDtoConfig
> {
  constructor(readonly repository: ContextVarRepository) {
    super(repository);
  }
}
