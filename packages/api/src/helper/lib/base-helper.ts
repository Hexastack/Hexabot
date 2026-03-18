/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import path from 'path';

import { Inject, OnModuleInit } from '@nestjs/common';
import { z } from 'zod';

import { SettingService } from '@/setting/services/setting.service';
import { Extension } from '@/utils/generics/extension';
import { HyphenToUnderscore } from '@/utils/types/extension';

import { HelperService } from '../helper.service';
import { HelperName, HelperSetting, HelperType } from '../types';

type HelperSettings<N extends HelperName> =
  HyphenToUnderscore<N> extends keyof Settings
    ? Settings[HyphenToUnderscore<N>]
    : Record<string, unknown>;

export default abstract class BaseHelper<
    N extends HelperName = HelperName,
    TSettings = HelperSettings<N>,
  >
  extends Extension
  implements OnModuleInit
{
  protected readonly settings: HelperSetting<N>[] = [];

  protected readonly settingsSchema?: z.ZodType<TSettings>;

  protected abstract type: HelperType;

  @Inject(SettingService)
  protected readonly settingService: SettingService;

  @Inject(HelperService)
  protected readonly helperService: HelperService;

  constructor(name: N) {
    super(name);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const settingsModule = require(path.join(this.getPath(), 'settings')) as {
      default: HelperSetting<N>[];
      settingsSchema?: z.ZodType<TSettings>;
    };

    this.settings = settingsModule.default;
    this.settingsSchema = settingsModule.settingsSchema;
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
  async getSettings(): Promise<TSettings> {
    const settings = await this.settingService.getSettings();
    const rawSettings = settings[this.getNamespace() as keyof Settings];

    if (this.settingsSchema) {
      return this.settingsSchema.parse(rawSettings);
    }

    return rawSettings as TSettings;
  }
}
