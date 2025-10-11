/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Controller, Get } from '@nestjs/common';

import { ChannelService } from '@/channel/channel.service';
import { HelperService } from '@/helper/helper.service';
import { PluginService } from '@/plugins/plugins.service';

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
