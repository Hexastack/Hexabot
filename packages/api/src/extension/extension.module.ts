/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { LoggerService } from '@hexabot/logger';
import { Global, Module, OnApplicationBootstrap } from '@nestjs/common';

import { AppInstance } from '@/app.instance';

import { CleanupService } from './cleanup.service';

@Global()
@Module({
  providers: [CleanupService],
  exports: [CleanupService],
})
export class ExtensionModule implements OnApplicationBootstrap {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly cleanupService: CleanupService,
  ) {}

  async onApplicationBootstrap() {
    if (!AppInstance.isReady()) {
      // bypass in test or CLI env
      return;
    }

    try {
      await this.cleanupService.pruneExtensionSettings();
    } catch (error) {
      this.loggerService.error('Unable to delete unused settings', error);
    }
  }
}
