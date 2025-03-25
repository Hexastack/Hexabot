/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { LoggerModule } from '@/logger/logger.module';
import { DummyPlugin } from '@/utils/test/dummy/dummy.plugin';
import { buildTestingMocks } from '@/utils/test/utils';

import { BaseBlockPlugin } from './base-block-plugin';
import { PluginService } from './plugins.service';
import { PluginType } from './types';

describe('PluginsService', () => {
  let pluginsService: PluginService;
  let dummyPlugin: DummyPlugin;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      providers: [PluginService, DummyPlugin],
      imports: [LoggerModule],
    });
    [pluginsService, dummyPlugin] = await getMocks([
      PluginService,
      DummyPlugin,
    ]);
    await dummyPlugin.onModuleInit();
  });

  afterAll(jest.clearAllMocks);
  describe('getAll', () => {
    it('should return an array of instances of base plugin', () => {
      const result = pluginsService.getAllByType(PluginType.block);
      expect(result.every((p) => p instanceof BaseBlockPlugin)).toBeTruthy();
    });
  });

  describe('getPlugin', () => {
    it('should return the required plugin', () => {
      const result = pluginsService.getPlugin(PluginType.block, 'dummy-plugin');
      expect(result).toBeInstanceOf(DummyPlugin);
    });
  });
});
