/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';

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
    return await this.settingService.deleteMany({
      $or: criteria.map(({ suffix, namespaces }) => ({
        group: { $regex: new RegExp(`${suffix}$`), $nin: namespaces },
      })),
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
