/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseOrmService } from '@/utils/generics/base-orm.service';

import { WorkflowDtoConfig, WorkflowTransformerDto } from '../dto/workflow.dto';
import { WorkflowOrmEntity } from '../entities/workflow.entity';
import { WorkflowRepository } from '../repositories/workflow.repository';

@Injectable()
export class WorkflowService extends BaseOrmService<
  WorkflowOrmEntity,
  WorkflowTransformerDto,
  WorkflowDtoConfig,
  WorkflowRepository
> {
  /**
   * Creates the workflow service with the injected repository.
   *
   * @param repository - ORM repository used to manage workflow entities.
   */
  constructor(readonly repository: WorkflowRepository) {
    super(repository);
  }
}
