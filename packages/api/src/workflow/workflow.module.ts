/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { forwardRef, Module } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChatModule } from '@/chat/chat.module';
import { CmsModule } from '@/cms';
import { UserModule } from '@/user';

import { ConversationalWorkflowContext } from './contexts/conversational-workflow.context';
import { ManualWorkflowContext } from './contexts/manual-workflow.context';
import { ScheduledWorkflowContext } from './contexts/scheduled-workflow.context';
import { WorkflowContextFactory } from './contexts/workflow-context-factory';
import { MemoryDefinitionController } from './controllers/memory-definition.controller';
import { WorkflowController } from './controllers/workflow.controller';
import { MemoryDefinitionOrmEntity } from './entities/memory-definition.entity';
import { MemoryRecordOrmEntity } from './entities/memory-record.entity';
import { WorkflowRunOrmEntity } from './entities/workflow-run.entity';
import { WorkflowOrmEntity } from './entities/workflow.entity';
import { MemoryDefinitionRepository } from './repositories/memory-definition.repository';
import { MemoryRecordRepository } from './repositories/memory-record.repository';
import { WorkflowRunRepository } from './repositories/workflow-run.repository';
import { WorkflowRepository } from './repositories/workflow.repository';
import { AgenticService } from './services/agentic.service';
import { MemoryDefinitionService } from './services/memory-definition.service';
import { MemoryRecordService } from './services/memory-record.service';
import { MemoryService } from './services/memory.service';
import { WorkflowRunService } from './services/workflow-run.service';
import { WorkflowSchedulerService } from './services/workflow-scheduler.service';
import { WorkflowService } from './services/workflow.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkflowOrmEntity,
      WorkflowRunOrmEntity,
      MemoryDefinitionOrmEntity,
      MemoryRecordOrmEntity,
    ]),
    forwardRef(() => CmsModule),
    forwardRef(() => ChatModule),
    UserModule,
  ],
  controllers: [WorkflowController, MemoryDefinitionController],
  providers: [
    WorkflowRepository,
    WorkflowRunRepository,
    MemoryDefinitionRepository,
    MemoryRecordRepository,
    WorkflowService,
    WorkflowRunService,
    MemoryDefinitionService,
    MemoryRecordService,
    MemoryService,
    SchedulerRegistry,
    WorkflowSchedulerService,
    ConversationalWorkflowContext,
    ManualWorkflowContext,
    ScheduledWorkflowContext,
    WorkflowContextFactory,
    AgenticService,
  ],
  exports: [
    WorkflowRepository,
    WorkflowRunRepository,
    MemoryDefinitionRepository,
    MemoryRecordRepository,
    WorkflowService,
    WorkflowRunService,
    MemoryDefinitionService,
    MemoryRecordService,
    MemoryService,
    ConversationalWorkflowContext,
    AgenticService,
  ],
})
export class WorkflowModule {}
