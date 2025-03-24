/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
