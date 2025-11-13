/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { LoggerService } from '@hexabot/logger';
import { Module } from '@nestjs/common';

import { DummyRepository } from './repositories/dummy.repository';
import { DummyService } from './services/dummy.service';

@Module({
  providers: [DummyRepository, DummyService, LoggerService],
  exports: [DummyRepository, DummyService],
})
export class DummyModule {}
