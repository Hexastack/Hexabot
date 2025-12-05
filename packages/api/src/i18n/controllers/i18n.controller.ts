/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Controller, Get } from '@nestjs/common';

import { ActionService } from '@/actions/actions.service';
import { ChannelService } from '@/channel/channel.service';
import { HelperService } from '@/helper/helper.service';

@Controller('i18n')
export class I18nController {
  constructor(
    private readonly actionService: ActionService,
    private readonly helperService: HelperService,
    private readonly channelService: ChannelService,
  ) {}

  /**
   * Retrieves translations of all the installed extensions.
   * @returns An nested object that holds the translations grouped by language and extension name.
   */
  @Get()
  getTranslations() {
    const actions = this.actionService.getAll();
    const helpers = this.helperService.getAll();
    const channels = this.channelService.getAll();
    const extensions: Array<{
      getNamespace: () => string;
      getTranslations: () => unknown;
    }> = [...actions, ...helpers, ...channels];

    return extensions.reduce<Record<string, unknown>>((acc, curr) => {
      const namespace = curr.getNamespace();
      const translations = curr.getTranslations();

      if (translations !== undefined) {
        acc[namespace] = translations;
      }

      return acc;
    }, {});
  }
}
