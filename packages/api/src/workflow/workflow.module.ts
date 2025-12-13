/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkflowController } from './controllers/workflow.controller';
import { WorkflowRunOrmEntity } from './entities/workflow-run.entity';
import { WorkflowOrmEntity } from './entities/workflow.entity';
import { WorkflowRunRepository } from './repositories/workflow-run.repository';
import { WorkflowRepository } from './repositories/workflow.repository';
import { AgenticService } from './services/agentic.service';
import { WorkflowContext } from './services/workflow-context';
import { WorkflowRunService } from './services/workflow-run.service';
import { WorkflowService } from './services/workflow.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkflowOrmEntity, WorkflowRunOrmEntity]),
  ],
  controllers: [WorkflowController],
  providers: [
    WorkflowRepository,
    WorkflowRunRepository,
    WorkflowService,
    WorkflowRunService,
    WorkflowContext,
    AgenticService,
  ],
  exports: [
    WorkflowRepository,
    WorkflowRunRepository,
    WorkflowService,
    WorkflowRunService,
    WorkflowContext,
    AgenticService,
  ],
})
export class WorkflowModule {}
