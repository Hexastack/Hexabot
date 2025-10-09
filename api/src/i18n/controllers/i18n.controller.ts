/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Controller, Get, UseInterceptors } from '@nestjs/common';

import { ChannelService } from '@/channel/channel.service';
import { HelperService } from '@/helper/helper.service';
import { CsrfInterceptor } from '@/interceptors/csrf.interceptor';
import { PluginService } from '@/plugins/plugins.service';

@UseInterceptors(CsrfInterceptor)
@Controller('i18n')
export class I18nController {
  constructor(
    private readonly pluginService: PluginService,
    private readonly helperService: HelperService,
    private readonly channelService: ChannelService,
  ) {}

  /**
   * Retrieves translations of all the installed extensions.
   * @returns An nested object that holds the translations grouped by language and extension name.
   */
  @Get()
  getTranslations() {
    const plugins = this.pluginService.getAll();
    const helpers = this.helperService.getAll();
    const channels = this.channelService.getAll();
    return [...plugins, ...helpers, ...channels].reduce((acc, curr) => {
      acc[curr.getNamespace()] = curr.getTranslations();
      return acc;
    }, {});
  }
}
