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
  Workflow,
  WorkflowDtoConfig,
  WorkflowFull,
  WorkflowTransformerDto,
} from '../dto/workflow.dto';
import { WorkflowOrmEntity } from '../entities/workflow.entity';

@Injectable()
export class WorkflowRepository extends BaseOrmRepository<
  WorkflowOrmEntity,
  WorkflowTransformerDto,
  WorkflowDtoConfig
> {
  /**
   * Creates the repository with the underlying TypeORM repository.
   *
   * @param repository - TypeORM repository bound to the workflow entity.
   */
  constructor(
    @InjectRepository(WorkflowOrmEntity)
    repository: Repository<WorkflowOrmEntity>,
  ) {
    super(repository, [], { PlainCls: Workflow, FullCls: WorkflowFull });
  }
}
