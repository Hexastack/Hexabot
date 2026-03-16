/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChatModule } from '@/chat/chat.module';

import { ContentTypeController } from './controllers/content-type.controller';
import { ContentController } from './controllers/content.controller';
import { MenuController } from './controllers/menu.controller';
import { ContentTypeOrmEntity } from './entities/content-type.entity';
import { ContentOrmEntity } from './entities/content.entity';
import { MenuOrmEntity } from './entities/menu.entity';
import { ContentTypeRepository } from './repositories/content-type.repository';
import { ContentRepository } from './repositories/content.repository';
import { MenuRepository } from './repositories/menu.repository';
import { ContentRagIndexerService } from './services/content-rag-indexer.service';
import { ContentRagRetrieverService } from './services/content-rag-retriever.service';
import { ContentRagService } from './services/content-rag.service';
import { ContentTypeService } from './services/content-type.service';
import { ContentService } from './services/content.service';
import { MenuService } from './services/menu.service';
import { RagBackendService } from './services/rag-backend.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContentOrmEntity,
      ContentTypeOrmEntity,
      MenuOrmEntity,
    ]),
    forwardRef(() => ChatModule),
  ],
  controllers: [ContentController, ContentTypeController, MenuController],
  providers: [
    ContentTypeService,
    ContentService,
    RagBackendService,
    ContentRagIndexerService,
    ContentRagRetrieverService,
    ContentRagService,
    ContentTypeRepository,
    ContentRepository,
    MenuRepository,
    MenuService,
  ],
  exports: [MenuService, ContentService, ContentTypeService, ContentRagService],
})
export class CmsModule {}
