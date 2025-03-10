/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Module, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { LoggerService } from '@/logger/logger.service';
import { ZookeeperService } from '@/zookeeper/zookeeper.service';

import { CronjobService } from './cronjob.service';

@Module({
  providers: [CronjobService, ZookeeperService],
})
export class CronjobModule implements OnModuleInit {
  constructor(private loggerService: LoggerService) {}

  onModuleInit() {
    this.handleCron('on module init');
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  handleCron(arg: string) {
    this.loggerService.log('Running cron job with @Cron' + arg);
  }
}
