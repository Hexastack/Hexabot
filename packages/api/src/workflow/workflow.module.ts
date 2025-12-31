/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { forwardRef, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChatModule } from '@/chat/chat.module';
import { CmsModule } from '@/cms';

import { WorkflowController } from './controllers/workflow.controller';
import { WorkflowRunOrmEntity } from './entities/workflow-run.entity';
import { WorkflowOrmEntity } from './entities/workflow.entity';
import { WorkflowRunRepository } from './repositories/workflow-run.repository';
import { WorkflowRepository } from './repositories/workflow.repository';
import { AgenticService } from './services/agentic.service';
import { ConversationalWorkflowContext } from './services/conversational-workflow-context';
import { ManualWorkflowContext } from './services/manual-workflow-context';
import { ScheduledWorkflowContext } from './services/scheduled-workflow-context';
import { WorkflowRunService } from './services/workflow-run.service';
import { WorkflowSchedulerService } from './services/workflow-scheduler.service';
import { WorkflowService } from './services/workflow.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkflowOrmEntity, WorkflowRunOrmEntity]),
    forwardRef(() => CmsModule),
    forwardRef(() => ChatModule),
    ScheduleModule.forRoot(),
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
    AgenticService,
    WorkflowSchedulerService,
  ],
  exports: [
    WorkflowRepository,
    WorkflowRunRepository,
    WorkflowService,
    WorkflowRunService,
    ConversationalWorkflowContext,
    ManualWorkflowContext,
    ScheduledWorkflowContext,
    AgenticService,
    WorkflowSchedulerService,
  ],
})
export class WorkflowModule {}
