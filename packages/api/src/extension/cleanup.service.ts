/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { In, Like } from 'typeorm';
import { DeleteResult } from 'typeorm/driver/mongodb/typings';

import { ChannelService } from '@/channel/channel.service';
import { HelperService } from '@/helper/helper.service';
import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';

import { TCriteria, TExtractGroup } from './types';

@Injectable()
export class CleanupService {
  constructor(
    private readonly helperService: HelperService,
    private readonly loggerService: LoggerService,
    private readonly settingService: SettingService,
    private readonly channelService: ChannelService,
  ) {}

  /**
   * Deletes unused settings with the specified criteria.
   *
   * @param criteria - An array of criteria objects containing:
   *                   - suffix: Regex pattern to match setting groups
   *                   - groups: Array of groups to exclude from deletion
   * @returns A promise that resolves to the result of the deletion operation.
   */
  private async deleteManyBySuffixAndGroups(
    criteria: TCriteria[],
  ): Promise<DeleteResult> {
    const groupsToDelete = new Set<string>();

    for (const { suffix, groups } of criteria) {
      const matchingSettings = await this.settingService.find({
        where: { group: Like(`%${suffix}`) },
      });

      if (!matchingSettings.length) {
        continue;
      }

      const groupsSet = new Set<string>(groups);

      matchingSettings.forEach(({ group }) => {
        if (!groupsSet.has(group)) {
          groupsToDelete.add(group);
        }
      });
    }

    if (!groupsToDelete.size) {
      return { acknowledged: true, deletedCount: 0 };
    }

    return await this.settingService.deleteMany({
      where: { group: In(Array.from(groupsToDelete)) },
    });
  }

  /**
   * Retrieves a list of channel setting groups.
   *
   * @returns An array of channel groups.
   */
  public getChannelGroups(): TExtractGroup<'channel'>[] {
    return this.channelService
      .getAll()
      .map((channel) => channel.getName() as TExtractGroup<'channel'>);
  }

  /**
   * Retrieves a list of helper setting groups.
   *
   * @returns An array of helper groups.
   */
  public getHelperGroups(): TExtractGroup<'helper'>[] {
    return this.helperService
      .getAll()
      .map((helper) => helper.getName() as TExtractGroup<'helper'>);
  }

  /**
   * Prune extensions unused settings.
   *
   */
  public async pruneExtensionSettings(): Promise<void> {
    const channels = this.getChannelGroups();
    const helpers = this.getHelperGroups();
    const { deletedCount } = await this.deleteManyBySuffixAndGroups([
      { suffix: '-channel', groups: channels },
      { suffix: '-helper', groups: helpers },
    ]);

    if (deletedCount > 0) {
      this.loggerService.log(
        `${deletedCount} unused setting${deletedCount === 1 ? '' : 's'} ${deletedCount === 1 ? 'is' : 'are'} successfully deleted!`,
      );
    }
  }
}
