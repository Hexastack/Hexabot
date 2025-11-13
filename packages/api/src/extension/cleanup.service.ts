/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DeleteResult } from '@hexabot/core/database';
import { LoggerService } from '@hexabot/logger';
import { Injectable } from '@nestjs/common';
import { In, Like } from 'typeorm';

import { ChannelService } from '@/channel/channel.service';
import { HelperService } from '@/helper/helper.service';
import { SettingService } from '@/setting/services/setting.service';

import { TCriteria, TExtractExtension, TExtractNamespace } from './types';

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
   *                   - namespaces: Array of namespaces to exclude from deletion
   * @returns A promise that resolves to the result of the deletion operation.
   */
  private async deleteManyBySuffixAndNamespaces(
    criteria: TCriteria[],
  ): Promise<DeleteResult> {
    const groupsToDelete = new Set<string>();

    for (const { suffix, namespaces } of criteria) {
      const matchingSettings = await this.settingService.find({
        where: { group: Like(`%${suffix}`) },
      });

      if (!matchingSettings.length) {
        continue;
      }

      const namespacesSet = new Set<string>(namespaces);

      matchingSettings.forEach(({ group }) => {
        if (!namespacesSet.has(group)) {
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
   * Retrieves a list of channel Namespaces.
   *
   * @returns An array of channel Namespaces.
   */
  public getChannelNamespaces(): TExtractNamespace<'channel'>[] {
    return this.channelService
      .getAll()
      .map((channel) => channel.getNamespace<TExtractExtension<'channel'>>());
  }

  /**
   * Retrieves a list of helper Namespaces.
   *
   * @returns An array of helper Namespaces.
   */
  public getHelperNamespaces(): TExtractNamespace<'helper'>[] {
    return this.helperService
      .getAll()
      .map((helper) => helper.getNamespace<TExtractExtension<'helper'>>());
  }

  /**
   * Prune extensions unused settings.
   *
   */
  public async pruneExtensionSettings(): Promise<void> {
    const channels = this.getChannelNamespaces();
    const helpers = this.getHelperNamespaces();
    const { deletedCount } = await this.deleteManyBySuffixAndNamespaces([
      { suffix: '_channel', namespaces: channels },
      { suffix: '_helper', namespaces: helpers },
    ]);

    if (deletedCount > 0) {
      this.loggerService.log(
        `${deletedCount} unused setting${deletedCount === 1 ? '' : 's'} ${deletedCount === 1 ? 'is' : 'are'} successfully deleted!`,
      );
    }
  }
}
