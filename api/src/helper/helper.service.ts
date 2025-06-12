/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';

import BaseHelper from './lib/base-helper';
import { HelperName, HelperRegistry, HelperType, TypeOfHelper } from './types';

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
  public register<H extends BaseHelper>(helper: H) {
    const helpers = this.registry.get(helper.getType()) as Map<string, H>;
    if (helpers.has(helper.getName())) {
      throw new InternalServerErrorException(
        `Helper with Name ${helper.getName()} and Type ${helper.getType()} already exist`,
      );
    }
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
  public get<T extends HelperType>(type: T, name: HelperName) {
    const helpers = this.registry.get(type) as Map<string, BaseHelper>;

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
   * Retrieves all registered helpers as an array.
   *
   * @returns An array containing all the registered helpers.
   */
  public getAll(): BaseHelper[] {
    return Array.from(this.registry.values()) // Get all the inner maps
      .flatMap((innerMap) => Array.from(innerMap.values())); // Flatten and get the values from each inner map
  }

  /**
   * Get a helper by class.
   *
   * @param type - The type of helper.
   * @param name - The helper's name.
   *
   * @returns - The helper
   */
  public use<
    T extends HelperType,
    C extends new (...args: any[]) => TypeOfHelper<T>,
  >(type: T, cls: C) {
    const helpers = this.getAllByType(type);

    const helper = helpers.find((h) => h instanceof cls);

    if (!helper) {
      throw new Error(`Unable to find the requested helper`);
    }

    return helper as InstanceType<C>;
  }

  /**
   * Get default NLU helper.
   *
   * @deprecated Use getDefaultHelper() instead
   * @returns - The helper
   */
  async getDefaultNluHelper() {
    const settings = await this.settingService.getSettings();

    const defaultHelper = this.get(
      HelperType.NLU,
      settings.chatbot_settings.default_nlu_helper as HelperName,
    );

    if (!defaultHelper) {
      throw new Error(`Unable to find default NLU helper`);
    }

    return defaultHelper;
  }

  /**
   * Get default LLM helper.
   *
   * @deprecated Use getDefaultHelper() instead
   * @returns - The helper
   */
  async getDefaultLlmHelper() {
    const settings = await this.settingService.getSettings();

    const defaultHelper = this.get(
      HelperType.LLM,
      settings.chatbot_settings.default_llm_helper as HelperName,
    );

    if (!defaultHelper) {
      throw new Error(`Unable to find default LLM helper`);
    }

    return defaultHelper;
  }

  /**
   * Get default helper for a specific type.
   *
   * @param type - The type of the helper (e.g., NLU, LLM, STORAGE).
   * @returns - The helper
   */
  async getDefaultHelper<T extends HelperType>(type: T) {
    if (type === HelperType.UTIL) {
      throw new Error(
        `Default helpers are not available for type: ${HelperType.UTIL}`,
      );
    }

    const settings = await this.settingService.getSettings();
    const defaultHelperKey = `default_${type}_helper`;
    if (!(defaultHelperKey in settings.chatbot_settings)) {
      throw new Error(`Default ${type.toUpperCase()} helper setting not found`);
    }

    const defaultHelperName = settings.chatbot_settings[
      defaultHelperKey
    ] as HelperName;

    const defaultHelper = this.get<T>(type, defaultHelperName);

    if (!defaultHelper) {
      throw new Error(`Unable to find default ${type.toUpperCase()} helper`);
    }

    return defaultHelper;
  }
}
