/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';

import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';

import BaseHelper from './lib/base-helper';
import { HelperRegistry, HelperType, TypeOfHelper } from './types';

@Injectable()
export class HelperService {
  private registry: HelperRegistry = new Map();

  constructor(
    private readonly settingService: SettingService,
    private readonly logger: LoggerService,
  ) {
    // Init empty registry
    Object.values(HelperType).forEach((type: HelperType) => {
      this.registry.set(type, new Map());
    });
  }

  /**
   * Registers a helper.
   *
   * @param name - The helper to be registered.
   */
  public register<H extends BaseHelper<string>>(helper: H) {
    const helpers = this.registry.get(helper.getType());
    helpers.set(helper.getName(), helper);
    this.logger.log(`Helper "${helper.getName()}" has been registered!`);
  }

  /**
   * Get a helper by name and type.
   *
   * @param type - The type of helper.
   * @param name - The helper's name.
   *
   * @returns - The helper
   */
  public get<T extends HelperType>(type: T, name: string) {
    const helpers = this.registry.get(type);

    if (!helpers.has(name)) {
      throw new Error('Uknown type of helpers');
    }
    return helpers.get(name) as TypeOfHelper<T>;
  }

  /**
   * Get all helpers by type.
   *
   * @returns - The helpers
   */
  public getAllByType<T extends HelperType>(type: T) {
    const helpers = this.registry.get(type) as Map<string, TypeOfHelper<T>>;

    return Array.from(helpers.values());
  }

  /**
   * Get default NLU helper.
   *
   * @returns - The helper
   */
  async getDefaultNluHelper() {
    const settings = await this.settingService.getSettings();

    const defaultHelper = this.get(
      HelperType.NLU,
      settings.chatbot_settings.default_nlu_helper,
    );

    if (!defaultHelper) {
      throw new Error(`Unable to find default NLU helper`);
    }

    return defaultHelper;
  }

  /**
   * Get default LLM helper.
   *
   * @returns - The helper
   */
  async getDefaultLlmHelper() {
    const settings = await this.settingService.getSettings();

    const defaultHelper = this.get(
      HelperType.LLM,
      settings.chatbot_settings.default_llm_helper,
    );

    if (!defaultHelper) {
      throw new Error(`Unable to find default LLM helper`);
    }

    return defaultHelper;
  }
}
