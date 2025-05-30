/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Global, Module, OnApplicationBootstrap } from '@nestjs/common';

import { AppInstance } from '@/app.instance';
import { LoggerService } from '@/logger/logger.service';

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
