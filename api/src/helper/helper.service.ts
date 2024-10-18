/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';

import { LoggerService } from '@/logger/logger.service';

import BaseHelper from './lib/BaseHelper';
import { HelperRegistry, HelperType, TypeOfHelper } from './lib/types';

@Injectable()
export class HelperService {
  private registry: HelperRegistry = new Map();

  constructor(private readonly logger: LoggerService) {
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
    const helpers = this.registry.get(helper.getType());
    helpers.set(helper.getName(), helper);
    this.logger.log(`Helper "${helper.getName()}" has been registered!`);
  }

  /**
   * Get a helper by name and type.
   *
   * @param type - The typep of helper.
   * @param name - The helper name to be registered.
   *
   * @returns - The helper
   */
  public get<T extends HelperType>(type: T, name: string) {
    if (!this.registry.has(type)) {
      throw new Error('Uknown type of helpers');
    }
    const helpers = this.registry.get(type);

    if (!helpers.has(name)) {
      throw new Error('Uknown type of helpers');
    }
    return helpers.get(name) as TypeOfHelper<T>;
  }
}
