/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ChatModule } from '@/chat/chat.module';

import { ContentTypeController } from './controllers/content-type.controller';
import { ContentController } from './controllers/content.controller';
import { MenuController } from './controllers/menu.controller';
import { ContentTypeRepository } from './repositories/content-type.repository';
import { ContentRepository } from './repositories/content.repository';
import { MenuRepository } from './repositories/menu.repository';
import { ContentTypeModel } from './schemas/content-type.schema';
import { ContentModel } from './schemas/content.schema';
import { MenuModel } from './schemas/menu.schema';
import { ContentTypeService } from './services/content-type.service';
import { ContentService } from './services/content.service';
import { MenuService } from './services/menu.service';

@Module({
  imports: [
    MongooseModule.forFeature([ContentModel, ContentTypeModel, MenuModel]),
    forwardRef(() => ChatModule),
  ],
  controllers: [ContentController, ContentTypeController, MenuController],
  providers: [
    ContentTypeService,
    ContentService,
    ContentTypeRepository,
    ContentRepository,
    MenuRepository,
    MenuService,
  ],
  exports: [MenuService, ContentService, ContentTypeService],
})
export class CmsModule {}
