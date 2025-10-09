/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { forwardRef, Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';

import { AttachmentModule } from '@/attachment/attachment.module';
import { ChannelModule } from '@/channel/channel.module';
import { CmsModule } from '@/cms/cms.module';
import { NlpModule } from '@/nlp/nlp.module';
import { UserModule } from '@/user/user.module';

import { BlockController } from './controllers/block.controller';
import { CategoryController } from './controllers/category.controller';
import { ContextVarController } from './controllers/context-var.controller';
import { LabelGroupController } from './controllers/label-group.controller';
import { LabelController } from './controllers/label.controller';
import { MessageController } from './controllers/message.controller';
import { SubscriberController } from './controllers/subscriber.controller';
import { BlockRepository } from './repositories/block.repository';
import { CategoryRepository } from './repositories/category.repository';
import { ContextVarRepository } from './repositories/context-var.repository';
import { ConversationRepository } from './repositories/conversation.repository';
import { LabelGroupRepository } from './repositories/label-group.repository';
import { LabelRepository } from './repositories/label.repository';
import { MessageRepository } from './repositories/message.repository';
import { SubscriberRepository } from './repositories/subscriber.repository';
import { BlockModel } from './schemas/block.schema';
import { CategoryModel } from './schemas/category.schema';
import { ContextVarModel } from './schemas/context-var.schema';
import { ConversationModel } from './schemas/conversation.schema';
import { LabelGroupModel } from './schemas/label-group.schema';
import { LabelModel } from './schemas/label.schema';
import { MessageModel } from './schemas/message.schema';
import { SubscriberModel } from './schemas/subscriber.schema';
import { CategorySeeder } from './seeds/category.seed';
import { ContextVarSeeder } from './seeds/context-var.seed';
import { BlockService } from './services/block.service';
import { BotService } from './services/bot.service';
import { CategoryService } from './services/category.service';
import { ChatService } from './services/chat.service';
import { ContextVarService } from './services/context-var.service';
import { ConversationService } from './services/conversation.service';
import { LabelGroupService } from './services/label-group.service';
import { LabelService } from './services/label.service';
import { MessageService } from './services/message.service';
import { SubscriberService } from './services/subscriber.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      CategoryModel,
      ContextVarModel,
      LabelModel,
      LabelGroupModel,
      BlockModel,
      MessageModel,
      SubscriberModel,
      ConversationModel,
      SubscriberModel,
    ]),
    forwardRef(() => ChannelModule),
    CmsModule,
    AttachmentModule,
    EventEmitter2,
    UserModule,
    NlpModule,
  ],
  controllers: [
    CategoryController,
    ContextVarController,
    LabelController,
    LabelGroupController,
    BlockController,
    MessageController,
    SubscriberController,
  ],
  providers: [
    CategoryRepository,
    ContextVarRepository,
    LabelRepository,
    LabelGroupRepository,
    BlockRepository,
    MessageRepository,
    SubscriberRepository,
    ConversationRepository,
    CategoryService,
    ContextVarService,
    LabelService,
    LabelGroupService,
    BlockService,
    MessageService,
    SubscriberService,
    CategorySeeder,
    ContextVarSeeder,
    ConversationService,
    ChatService,
    BotService,
  ],
  exports: [
    SubscriberService,
    MessageService,
    LabelService,
    LabelGroupService,
    BlockService,
    ConversationService,
  ],
})
export class ChatModule {}
