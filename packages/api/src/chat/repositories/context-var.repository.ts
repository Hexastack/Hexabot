/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import {
  ContextVar,
  ContextVarDtoConfig,
  ContextVarFull,
  ContextVarTransformerDto,
} from '../dto/context-var.dto';
import { ContextVarOrmEntity } from '../entities/context-var.entity';

@Injectable()
export class ContextVarRepository extends BaseOrmRepository<
  ContextVarOrmEntity,
  ContextVarTransformerDto,
  ContextVarDtoConfig
> {
  constructor(
    @InjectRepository(ContextVarOrmEntity)
    repository: Repository<ContextVarOrmEntity>,
  ) {
    super(repository, [], {
      PlainCls: ContextVar,
      FullCls: ContextVarFull,
    });
  }
}
