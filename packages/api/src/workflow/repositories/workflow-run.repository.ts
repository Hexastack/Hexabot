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
  WorkflowRun,
  WorkflowRunDtoConfig,
  WorkflowRunFull,
  WorkflowRunTransformerDto,
} from '../dto/workflow-run.dto';
import { WorkflowRunOrmEntity } from '../entities/workflow-run.entity';

@Injectable()
export class WorkflowRunRepository extends BaseOrmRepository<
  WorkflowRunOrmEntity,
  WorkflowRunTransformerDto,
  WorkflowRunDtoConfig
> {
  /**
   * Creates the repository with the TypeORM backing repository.
   *
   * @param repository - TypeORM repository bound to the workflow run entity.
   */
  constructor(
    @InjectRepository(WorkflowRunOrmEntity)
    repository: Repository<WorkflowRunOrmEntity>,
  ) {
    super(repository, ['workflow', 'subscriber'], {
      PlainCls: WorkflowRun,
      FullCls: WorkflowRunFull,
    });
  }
}
