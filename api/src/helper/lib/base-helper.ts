/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import path from 'path';

import { OnModuleInit } from '@nestjs/common';

import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';
import { Extension } from '@/utils/generics/extension';
import { HyphenToUnderscore } from '@/utils/types/extension';

import { HelperService } from '../helper.service';
import { HelperName, HelperSetting, HelperType } from '../types';

export default abstract class BaseHelper<N extends HelperName = HelperName>
  extends Extension
  implements OnModuleInit
{
  protected readonly settings: HelperSetting<N>[] = [];

  protected abstract type: HelperType;

  constructor(
    name: N,
    protected readonly settingService: SettingService,
    protected readonly helperService: HelperService,
    protected readonly logger: LoggerService,
  ) {
    super(name);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    this.settings = require(path.join(this.getPath(), 'settings')).default;
  }

  async onModuleInit() {
    await super.onModuleInit();
    this.helperService.register(this);
    this.setup();
  }

  async setup() {
    await this.settingService.seedIfNotExist(
      this.getName(),
      this.settings.map((s, i) => ({
        ...s,
        weight: i + 1,
      })),
    );
  }

  /**
   * Get the helper's type
   *
   * @returns Helper's type
   */
  public getType() {
    return this.type;
  }

  /**
   * Get the helper's settings
   *
   * @returns Helper's settings
   */
  async getSettings<S extends string = HyphenToUnderscore<N>>() {
    const settings = await this.settingService.getSettings();
    // @ts-expect-error workaround typing
    return settings[this.getNamespace() as keyof Settings] as Settings[S];
  }
}
