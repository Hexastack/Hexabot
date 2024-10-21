/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Controller, Get, Param } from '@nestjs/common';

import { Roles } from '@/utils/decorators/roles.decorator';

import { HelperService } from './helper.service';
import { HelperType } from './types';

@Controller('helper')
export class HelperController {
  constructor(private readonly helperService: HelperService) {}

  /**
   * Retrieves a list of helpers.
   *
   * @returns An array of objects containing the name of each NLP helper.
   */
  @Roles('public')
  @Get(':type')
  getHelpers(@Param('type') type: HelperType) {
    return this.helperService.getAllByType(type).map((helper) => {
      return {
        name: helper.getName(),
      };
    });
  }
}
