/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { LoggerModule } from '@hexabot/logger';

import { DummyPlugin } from '@hexabot/dev/dummy/dummy.plugin';
import { buildTestingMocks } from '@hexabot/dev/utils';

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
