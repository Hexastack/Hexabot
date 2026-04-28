/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BadRequestException, Controller, Get, Param } from '@nestjs/common';

import { Roles } from '@/utils/decorators/roles.decorator';

import { HelperService } from './helper.service';
import { HelperType } from './types';

@Controller('helper')
export class HelperController {
  constructor(private readonly helperService: HelperService) {}

  private normalizeHelperType(type: string): HelperType {
    if (!Object.values(HelperType).includes(type as HelperType)) {
      throw new BadRequestException(`Unknown helper type "${type}"`);
    }

    return type as HelperType;
  }

  /**
   * Retrieves a list of helpers.
   *
   * @returns An array of objects containing the name of each helper.
   */
  @Roles('public')
  @Get(':type')
  getHelpers(@Param('type') type: string) {
    const helperType = this.normalizeHelperType(type);

    return this.helperService.getAllByType(helperType).map((helper) => {
      return {
        name: helper.getName(),
      };
    });
  }
}
