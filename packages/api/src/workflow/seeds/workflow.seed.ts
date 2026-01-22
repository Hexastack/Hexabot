/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseOrmSeeder } from '@/utils/generics/base-orm.seeder';

import {
  WorkflowDtoConfig,
  WorkflowNewVersionDto,
  WorkflowTransformerDto,
} from '../dto/workflow.dto';
import { WorkflowOrmEntity } from '../entities/workflow.entity';
import { WorkflowRepository } from '../repositories/workflow.repository';
import { WorkflowService } from '../services/workflow.service';

@Injectable()
export class WorkflowSeeder extends BaseOrmSeeder<
  WorkflowOrmEntity,
  WorkflowTransformerDto,
  WorkflowDtoConfig
> {
  constructor(
    workflowRepository: WorkflowRepository,
    private readonly workflowService: WorkflowService,
  ) {
    super(workflowRepository);
  }

  async seed(models: WorkflowNewVersionDto[]): Promise<boolean> {
    if (await this.isEmpty()) {
      for (const model of models) {
        await this.workflowService.create(model);
      }

      return true;
    }

    return false;
  }
}
