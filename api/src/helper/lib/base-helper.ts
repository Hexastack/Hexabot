/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { LoggerService } from '@nestjs/common';

import { SettingService } from '@/setting/services/setting.service';
import { hyphenToUnderscore } from '@/utils/helpers/misc';

import { HelperService } from '../helper.service';
import { HelperSetting, HelperType } from '../types';

export default abstract class BaseHelper<N extends string = string> {
  protected readonly name: N;

  protected readonly settings: HelperSetting<N>[] = [];

  protected abstract type: HelperType;

  constructor(
    name: N,
    settings: HelperSetting<N>[],
    protected readonly settingService: SettingService,
    protected readonly helperService: HelperService,
    protected readonly logger: LoggerService,
  ) {
    this.name = name;
    this.settings = settings;
  }

  onModuleInit() {
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
   * Returns the helper's name
   *
   * @returns Helper's name
   */
  public getName() {
    return this.name;
  }

  /**
   * Returns the helper's group
   * @returns Helper's group
   */
  protected getGroup() {
    return hyphenToUnderscore(this.getName()) as HelperSetting<N>['group'];
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
    return settings[this.getGroup() as keyof Settings] as Settings[S];
  }
}
