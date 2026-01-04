/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChatModule } from '@/chat/chat.module';
import { CmsModule } from '@/cms';

import { ConversationalWorkflowContext } from './contexts/conversational-workflow.context';
import { ManualWorkflowContext } from './contexts/manual-workflow.context';
import { ScheduledWorkflowContext } from './contexts/scheduled-workflow.context';
import { WorkflowContextFactory } from './contexts/workflow-context-factory';
import { WorkflowController } from './controllers/workflow.controller';
import { WorkflowRunOrmEntity } from './entities/workflow-run.entity';
import { WorkflowOrmEntity } from './entities/workflow.entity';
import { WorkflowRunRepository } from './repositories/workflow-run.repository';
import { WorkflowRepository } from './repositories/workflow.repository';
import { AgenticService } from './services/agentic.service';
import { WorkflowRunService } from './services/workflow-run.service';
import { WorkflowService } from './services/workflow.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkflowOrmEntity, WorkflowRunOrmEntity]),
    forwardRef(() => CmsModule),
    forwardRef(() => ChatModule),
  ],
  controllers: [WorkflowController],
  providers: [
    WorkflowRepository,
    WorkflowRunRepository,
    WorkflowService,
    WorkflowRunService,
    ConversationalWorkflowContext,
    ManualWorkflowContext,
    ScheduledWorkflowContext,
    WorkflowContextFactory,
    AgenticService,
  ],
  exports: [
    WorkflowRepository,
    WorkflowRunRepository,
    WorkflowService,
    WorkflowRunService,
    ConversationalWorkflowContext,
    AgenticService,
  ],
})
export class WorkflowModule {}
