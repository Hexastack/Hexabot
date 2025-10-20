/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { Raw } from 'typeorm';

import { ChannelService } from '@/channel/channel.service';
import { HelperService } from '@/helper/helper.service';
import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';
import { DeleteResult } from '@/utils/generics/base-repository';

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
    const where = criteria.map(({ suffix, namespaces }) => {
      const pattern = `%${suffix}`;

      if (!namespaces.length) {
        return {
          group: Raw((alias) => `${alias} LIKE :pattern`, { pattern }),
        };
      }

      return {
        group: Raw(
          (alias) =>
            `${alias} LIKE :pattern AND ${alias} NOT IN (:...namespaces)`,
          { pattern, namespaces },
        ),
      };
    });

    return await this.settingService.deleteMany({ where });
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
