/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable, OnModuleInit } from '@nestjs/common';

import { ChannelService } from '@/channel/channel.service';
import { HelperService } from '@/helper/helper.service';
import { LoggerService } from '@/logger/logger.service';
import { PluginService } from '@/plugins/plugins.service';
import { SettingService } from '@/setting/services/setting.service';

@Injectable()
export class CleanupService implements OnModuleInit {
  constructor(
    private readonly helperService: HelperService,
    private readonly pluginService: PluginService,
    private readonly channelService: ChannelService,
    private readonly settingService: SettingService,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit() {
    await this.cleanupOrphanedSettings();
  }

  private async cleanupOrphanedSettings() {
    enum ExtensionType {
      'helper',
      'plugin',
      'channel',
    }
    const activeExtensions = [
      ...this.getHelperNames(),
      ...this.getPluginNames(),
      ...this.getChannelNames(),
    ];

    this.logger.debug('Cleaning up orphaned settings...');

    const settingGroups = await this.settingService.getAllGroups();

    for (const group of settingGroups) {
      const extensionType = group.split('_').pop() ?? '';
      debugger;
      if (extensionType in ExtensionType && !activeExtensions.includes(group)) {
        this.logger.debug(`Deleting orphaned settings for ${group}...`);
        await this.settingService.deleteGroup(group);
      }
    }
  }

  private getHelperNames(): string[] {
    return this.helperService.getAll().map((handler) => handler.getNamespace());
  }

  private getPluginNames(): string[] {
    return this.pluginService.getAll().map((handler) => handler.getNamespace());
  }

  private getChannelNames(): string[] {
    return this.channelService
      .getAll()
      .map((handler) => handler.getNamespace());
  }
}
