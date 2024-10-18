/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { LoggerService } from '@nestjs/common';

import { SettingCreateDto } from '@/setting/dto/setting.dto';
import { SettingService } from '@/setting/services/setting.service';

import { HelperType } from './types';
import { HelperService } from '../helper.service';

export default abstract class BaseHelper {
  protected abstract name: string;
  protected abstract type: HelperType;

  protected settings: SettingCreateDto[] = [];

  constructor(
    protected readonly settingService: SettingService,
    protected readonly helperService: HelperService,
    protected readonly logger: LoggerService,
  ) {}

  onModuleInit() {
    this.helperService.register(this);
    this.setup();
  }

  async setup() {
    await this.settingService.seedIfNotExist(this.getName(), this.settings);
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
   * Returns the helper's type
   *
   * @returns Helper's type
   */
  public getType() {
    return this.type;
  }
}
