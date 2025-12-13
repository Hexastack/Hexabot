/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AttachmentModule } from '@/attachment/attachment.module';
import { CmsModule } from '@/cms/cms.module';
import { NlpModule } from '@/nlp/nlp.module';
import { UserProfileOrmEntity } from '@/user/entities/user-profile.entity';
import { UserModule } from '@/user/user.module';
import { WorkflowModule } from '@/workflow/workflow.module';

import { ContextVarController } from './controllers/context-var.controller';
import { LabelGroupController } from './controllers/label-group.controller';
import { LabelController } from './controllers/label.controller';
import { MessageController } from './controllers/message.controller';
import { SubscriberController } from './controllers/subscriber.controller';
import { ContextVarOrmEntity } from './entities/context-var.entity';
import { LabelGroupOrmEntity } from './entities/label-group.entity';
import { LabelOrmEntity } from './entities/label.entity';
import { MessageOrmEntity } from './entities/message.entity';
import { SubscriberOrmEntity } from './entities/subscriber.entity';
import { ContextVarRepository } from './repositories/context-var.repository';
import { LabelGroupRepository } from './repositories/label-group.repository';
import { LabelRepository } from './repositories/label.repository';
import { MessageRepository } from './repositories/message.repository';
import { SubscriberRepository } from './repositories/subscriber.repository';
import { ContextVarSeeder } from './seeds/context-var.seed';
import { ChatService } from './services/chat.service';
import { ContextVarService } from './services/context-var.service';
import { LabelGroupService } from './services/label-group.service';
import { LabelService } from './services/label.service';
import { MessageService } from './services/message.service';
import { SubscriberService } from './services/subscriber.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserProfileOrmEntity,
      ContextVarOrmEntity,
      LabelOrmEntity,
      LabelGroupOrmEntity,
      MessageOrmEntity,
      SubscriberOrmEntity,
    ]),
    CmsModule,
    AttachmentModule,
    UserModule,
    NlpModule,
    WorkflowModule,
  ],
  controllers: [
    ContextVarController,
    LabelController,
    LabelGroupController,
    MessageController,
    SubscriberController,
  ],
  providers: [
    ContextVarRepository,
    LabelRepository,
    LabelGroupRepository,
    MessageRepository,
    SubscriberRepository,
    ContextVarService,
    LabelService,
    LabelGroupService,
    MessageService,
    SubscriberService,
    ContextVarSeeder,
    ChatService,
  ],
  exports: [SubscriberService, MessageService, LabelService, LabelGroupService],
})
export class ChatModule {}
