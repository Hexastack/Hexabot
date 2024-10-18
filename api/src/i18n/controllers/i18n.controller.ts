/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Controller, Get, UseInterceptors } from '@nestjs/common';

import { CsrfInterceptor } from '@/interceptors/csrf.interceptor';

import { I18nService } from '../services/i18n.service';

@UseInterceptors(CsrfInterceptor)
@Controller('i18n')
export class I18nController {
  constructor(private readonly i18nService: I18nService) {}

  /**
   * Retrieves translations of all the installed extensions.
   * @returns An nested object that holds the translations grouped by language and extension name.
   */
  @Get()
  getTranslations() {
    return this.i18nService.getExtensionI18nTranslations();
  }
}
