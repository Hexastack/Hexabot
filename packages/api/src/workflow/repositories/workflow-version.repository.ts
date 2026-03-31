/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import { WorkflowVersionOrmEntity } from '../entities/workflow-version.entity';

@Injectable()
export class WorkflowVersionRepository extends BaseOrmRepository<WorkflowVersionOrmEntity> {
  constructor(
    @InjectRepository(WorkflowVersionOrmEntity)
    repository: Repository<WorkflowVersionOrmEntity>,
  ) {
    super(repository, ['workflow', 'createdBy', 'parentVersion']);
  }
}
