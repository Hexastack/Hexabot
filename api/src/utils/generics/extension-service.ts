/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { OnApplicationBootstrap } from '@nestjs/common';

import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';

export abstract class ExtensionService<
  T extends { getNamespace(): string; getName(): string },
> implements OnApplicationBootstrap
{
  constructor(
    protected readonly settingService: SettingService,
    protected readonly logger: LoggerService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.cleanup(this.getExtensionType());
  }

  /**
   * Cleanups the unregistered extensions from settings.
   *
   * @param extensionType - The type of extension (e.g., 'plugin', 'helper', 'channel').
   */
  async cleanup(extensionType: 'channel' | 'plugin' | 'helper'): Promise<void> {
    const activeExtensions = this.getAll().map((handler) =>
      handler.getNamespace(),
    );

    const orphanSettings = (
      await this.settingService.getExtensionSettings(extensionType)
    ).filter((group) => !activeExtensions.includes(group));

    await Promise.all(
      orphanSettings.map(async (group) => {
        this.logger.log(`Deleting orphaned settings for ${group}...`);
        return this.settingService.deleteGroup(group);
      }),
    );
  }

  /**
   * Retrieves all registered extensions as an array.
   *
   * @returns An array containing all the registered extensions.
   */
  public abstract getAll(): T[];

  /**
   * Abstract method to get the type of extension this service manages.
   *
   * @returns The type of extension (e.g., 'plugin', 'helper', 'channel').
   */
  protected abstract getExtensionType(): 'channel' | 'plugin' | 'helper';
}
