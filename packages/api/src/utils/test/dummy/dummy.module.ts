/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';

import { LoggerService } from '@/logger/logger.service';
import { installDummyFixtures } from '@/utils/test/fixtures/dummy';
import { rootMongooseTestModule } from '@/utils/test/test';

import { DummyRepository } from './repositories/dummy.repository';
import { DummyModel } from './schemas/dummy.schema';
import { DummyService } from './services/dummy.service';

@Module({
  imports: [
    rootMongooseTestModule(installDummyFixtures),
    MongooseModule.forFeature([DummyModel]),
  ],
  providers: [DummyRepository, DummyService, EventEmitter2, LoggerService],
})
export class DummyModule {}
