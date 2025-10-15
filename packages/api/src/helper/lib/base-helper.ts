/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    this.settings = require(path.join(this.getPath(), 'settings')).default;
  }

  async onModuleInit() {
    await super.onModuleInit();
    this.helperService.register(this);
    this.setup();
  }

  async setup() {
    await this.settingService.seedIfNotExist(this.getName(), this.settings);
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
