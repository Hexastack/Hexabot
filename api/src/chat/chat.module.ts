/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { forwardRef, Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';

import { AttachmentModule } from '@/attachment/attachment.module';
import { ChannelModule } from '@/channel/channel.module';
import { CmsModule } from '@/cms/cms.module';
import { UserModule } from '@/user/user.module';

import { BlockController } from './controllers/block.controller';
import { CategoryController } from './controllers/category.controller';
import { ContextVarController } from './controllers/context-var.controller';
import { LabelController } from './controllers/label.controller';
import { MessageController } from './controllers/message.controller';
import { SubscriberController } from './controllers/subscriber.controller';
import { BlockRepository } from './repositories/block.repository';
import { CategoryRepository } from './repositories/category.repository';
import { ContextVarRepository } from './repositories/context-var.repository';
import { ConversationRepository } from './repositories/conversation.repository';
import { LabelRepository } from './repositories/label.repository';
import { MessageRepository } from './repositories/message.repository';
import { SubscriberRepository } from './repositories/subscriber.repository';
import { BlockModel } from './schemas/block.schema';
import { CategoryModel } from './schemas/category.schema';
import { ContextVarModel } from './schemas/context-var.schema';
import { ConversationModel } from './schemas/conversation.schema';
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
import { LabelService } from './services/label.service';
import { MessageService } from './services/message.service';
import { SubscriberService } from './services/subscriber.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      CategoryModel,
      ContextVarModel,
      LabelModel,
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
  ],
  controllers: [
    CategoryController,
    ContextVarController,
    LabelController,
    BlockController,
    MessageController,
    SubscriberController,
  ],
  providers: [
    CategoryRepository,
    ContextVarRepository,
    LabelRepository,
    BlockRepository,
    MessageRepository,
    SubscriberRepository,
    ConversationRepository,
    CategoryService,
    ContextVarService,
    LabelService,
    BlockService,
    MessageService,
    SubscriberService,
    CategorySeeder,
    ContextVarSeeder,
    ConversationService,
    ChatService,
    BotService,
  ],
  exports: [SubscriberService, MessageService, LabelService, BlockService],
})
export class ChatModule {}
