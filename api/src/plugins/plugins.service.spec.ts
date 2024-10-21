/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Test } from '@nestjs/testing';

import { LoggerModule } from '@/logger/logger.module';
import { DummyPlugin } from '@/utils/test/dummy/dummy.plugin';

import { BaseBlockPlugin } from './base-block-plugin';
import { PluginService } from './plugins.service';
import { PluginType } from './types';

describe('PluginsService', () => {
  let pluginsService: PluginService;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [PluginService, DummyPlugin],
      imports: [LoggerModule],
    }).compile();
    pluginsService = module.get<PluginService>(PluginService);
    module.get<DummyPlugin>(DummyPlugin).onModuleInit();
  });
  afterAll(async () => {
    jest.clearAllMocks();
  });
  describe('getAll', () => {
    it('should return an array of instances of base plugin', () => {
      const result = pluginsService.getAllByType(PluginType.block);
      expect(result.every((p) => p instanceof BaseBlockPlugin)).toBeTruthy();
    });
  });

  describe('getPlugin', () => {
    it('should return the required plugin', () => {
      const result = pluginsService.getPlugin(PluginType.block, 'dummy');
      expect(result).toBeInstanceOf(DummyPlugin);
    });
  });
});
