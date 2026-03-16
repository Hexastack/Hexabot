/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';

import { HelperService } from './helper.service';
import { HelperType } from './types';

describe('HelperService', () => {
  let service: HelperService;
  let logger: jest.Mocked<
    Pick<LoggerService, 'warn' | 'log' | 'error' | 'debug'>
  >;

  beforeEach(() => {
    const settingService = {
      getSettings: jest.fn(),
    } as unknown as SettingService;
    logger = {
      warn: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    service = new HelperService(
      settingService,
      logger as unknown as LoggerService,
    );
  });

  it('returns an empty array for unknown helper types', () => {
    const helpers = service.getAllByType('invalid' as HelperType);

    expect(helpers).toEqual([]);
    expect(logger.warn).toHaveBeenCalledWith(
      'Unknown helper type requested: invalid',
    );
  });
});
