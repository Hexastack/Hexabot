/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import fs from 'fs';

import { HttpService } from '@nestjs/axios';
import { ModuleRef } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';

import { LoggerService } from '@/logger/logger.service';
import { Metadata } from '@/setting/schemas/metadata.schema';
import { MetadataService } from '@/setting/services/metadata.service';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { Migration } from './migration.schema';
import { MigrationService } from './migration.service';
import { MigrationAction } from './types';

describe('MigrationService', () => {
  let service: MigrationService;
  let loggerService: LoggerService;
  let metadataService: MetadataService;

  beforeAll(async () => {
    const { getMocks, resolveMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(async () => await Promise.resolve())],
      providers: [
        MigrationService,
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {},
        },
        {
          provide: ModuleRef,
          useValue: {
            get: jest.fn((token: string) => {
              if (token === 'MONGO_MIGRATION_DIR') {
                return '/migrations';
              }
            }),
          },
        },
        {
          provide: getModelToken(Migration.name),
          useValue: jest.fn(),
        },
      ],
    });
    [service, metadataService] = await getMocks([
      MigrationService,
      MetadataService,
    ]);
    [loggerService] = await resolveMocks([LoggerService]);
  });

  afterEach(jest.clearAllMocks);
  afterAll(closeInMongodConnection);

  describe('create', () => {
    beforeEach(() => {
      jest.spyOn(service, 'exit').mockImplementation(); // Mock exit to avoid Jest process termination
      process.env.HEXABOT_CLI = 'true';
    });

    afterEach(jest.restoreAllMocks);

    it('should create a migration file and log success', () => {
      const mockFiles = ['12345-some-migration.migration.ts'];
      jest.spyOn(service, 'getMigrationFiles').mockReturnValue(mockFiles);
      jest
        .spyOn(service as any, 'getMigrationTemplate')
        .mockReturnValue('template');
      jest
        .spyOn(service as any, 'getMigrationName')
        .mockImplementation((file) => file);
      const exitSpy = jest.spyOn(service, 'exit').mockImplementation();

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'writeFileSync').mockReturnValue();

      service.create('v2.2.0');

      const expectedFilePath = expect.stringMatching(
        /\/migrations\/\d+-v-2-2-0.migration.ts$/,
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expectedFilePath,
        'template',
      );
      expect(loggerService.log).toHaveBeenCalledWith(
        expect.stringMatching(/Migration file for "v2.2.0" created/),
      );
      expect(exitSpy).toHaveBeenCalled();
    });

    it('should log an error and exit if a migration with the same name exists', () => {
      const mockFiles = ['12345-v-2-2-1.migration.ts'];
      jest.spyOn(service, 'getMigrationFiles').mockReturnValue(mockFiles);
      const exitSpy = jest.spyOn(service, 'exit').mockImplementation();

      service.create('v2.2.1');

      expect(loggerService.error).toHaveBeenCalledWith(
        'Migration file for "v2.2.1" already exists',
      );
      expect(exitSpy).toHaveBeenCalled();
    });
  });

  describe('onApplicationBootstrap', () => {
    beforeEach(() => {
      jest.spyOn(service, 'exit').mockImplementation(); // Mock exit to avoid Jest process termination
    });

    afterEach(jest.restoreAllMocks);

    it('should log a message and execute migrations when autoMigrate is true', async () => {
      process.env.HEXABOT_CLI = '';
      jest
        .spyOn(metadataService, 'findOne')
        .mockResolvedValue({ name: 'db-version', value: 'v2.1.9' } as Metadata);
      jest.spyOn(service, 'run').mockResolvedValue();

      await service.onApplicationBootstrap();

      expect(loggerService.log).toHaveBeenCalledWith(
        'Executing migrations ...',
      );
      expect(service.run).toHaveBeenCalledWith({
        action: 'up',
        isAutoMigrate: true,
      });
    });
  });

  describe('run', () => {
    beforeEach(() => {
      jest.spyOn(service, 'exit').mockImplementation(); // Mock exit to avoid Jest process termination
    });

    afterEach(jest.restoreAllMocks);

    it('should call runUpgrades when version is not provided and isAutoMigrate is true', async () => {
      process.env.HEXABOT_CLI = '';
      const runUpgradesSpy = jest
        .spyOn(service as any, 'runUpgrades')
        .mockResolvedValue('v2.2.0');

      await service.run({
        action: MigrationAction.UP,
        isAutoMigrate: true,
      });

      expect(runUpgradesSpy).toHaveBeenCalledWith('up', 'v2.1.9');
      expect(service.exit).not.toHaveBeenCalled();
    });

    it('should call runAll and exit when version is not provided and isAutoMigrate is false', async () => {
      process.env.HEXABOT_CLI = 'true';
      const runAllSpy = jest
        .spyOn(service as any, 'runAll')
        .mockResolvedValue('v2.2.0');

      await service.run({
        action: MigrationAction.UP,
        version: undefined,
        isAutoMigrate: false,
      });

      expect(runAllSpy).toHaveBeenCalledWith('up');
      expect(service.exit).toHaveBeenCalled();
    });

    it('should call runOne and exit when version is provided', async () => {
      process.env.HEXABOT_CLI = 'true';
      const runOneSpy = jest
        .spyOn(service as any, 'runOne')
        .mockResolvedValue('v2.2.0');

      await service.run({
        action: MigrationAction.UP,
        version: 'v2.1.9',
        isAutoMigrate: false,
      });

      expect(runOneSpy).toHaveBeenCalledWith({
        action: 'up',
        version: 'v2.1.9',
      });
      expect(service.exit).toHaveBeenCalled();
    });
  });

  describe('runOne', () => {
    let verifyStatusSpy: jest.SpyInstance;
    let loadMigrationFileSpy: jest.SpyInstance;
    let successCallbackSpy: jest.SpyInstance;
    let failureCallbackSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.spyOn(service, 'exit').mockImplementation(); // Mock exit to avoid Jest process termination

      verifyStatusSpy = jest
        .spyOn(service as any, 'verifyStatus')
        .mockResolvedValue({ exist: false, migrationDocument: {} });
      loadMigrationFileSpy = jest
        .spyOn(service as any, 'loadMigrationFile')
        .mockResolvedValue({
          up: jest.fn().mockResolvedValue(true),
          down: jest.fn().mockResolvedValue(true),
        });
      successCallbackSpy = jest
        .spyOn(service as any, 'successCallback')
        .mockResolvedValue(undefined);
      failureCallbackSpy = jest
        .spyOn(service as any, 'failureCallback')
        .mockResolvedValue(undefined);
    });

    afterEach(jest.restoreAllMocks);

    it('should return false and not execute if migration already exists', async () => {
      verifyStatusSpy.mockResolvedValue({ exist: true, migrationDocument: {} });

      const result = await (service as any).runOne({
        version: 'v2.1.9',
        action: 'up',
      });

      expect(verifyStatusSpy).toHaveBeenCalledWith({
        version: 'v2.1.9',
        action: 'up',
      });
      expect(result).toBe(false);
      expect(loadMigrationFileSpy).not.toHaveBeenCalled();
      expect(successCallbackSpy).not.toHaveBeenCalled();
      expect(failureCallbackSpy).not.toHaveBeenCalled();
    });

    it('should load the migration file and execute the migration action successfully', async () => {
      const migrationMock = {
        up: jest.fn().mockResolvedValue(true),
      };
      loadMigrationFileSpy.mockResolvedValue(migrationMock);

      const result = await (service as any).runOne({
        version: 'v2.1.9',
        action: 'up',
      });

      expect(result).toBe(true);
      expect(verifyStatusSpy).toHaveBeenCalledWith({
        version: 'v2.1.9',
        action: 'up',
      });
      expect(loadMigrationFileSpy).toHaveBeenCalledWith('v2.1.9');
      expect(migrationMock.up).toHaveBeenCalledWith({
        attachmentService: service['attachmentService'],
        logger: service['logger'],
        http: service['httpService'],
      });
      expect(successCallbackSpy).toHaveBeenCalledWith({
        version: 'v2.1.9',
        action: 'up',
        migrationDocument: {},
      });
      expect(failureCallbackSpy).not.toHaveBeenCalled();
    });

    it('should call failureCallback and log the error if the migration action throws an error', async () => {
      const migrationMock = {
        up: jest.fn().mockRejectedValue(new Error('Test Error')),
      };
      loadMigrationFileSpy.mockResolvedValue(migrationMock);
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      const result = await (service as any).runOne({
        version: 'v2.1.9',
        action: 'up',
      });
      expect(result).toBe(false);

      expect(verifyStatusSpy).toHaveBeenCalledWith({
        version: 'v2.1.9',
        action: 'up',
      });
      expect(loadMigrationFileSpy).toHaveBeenCalledWith('v2.1.9');
      expect(migrationMock.up).toHaveBeenCalledWith({
        attachmentService: service['attachmentService'],
        logger: service['logger'],
        http: service['httpService'],
      });
      expect(successCallbackSpy).not.toHaveBeenCalled();
      expect(failureCallbackSpy).toHaveBeenCalledWith({
        version: 'v2.1.9',
        action: 'up',
      });
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test Error'),
      );
    });

    it('should not call successCallback if the migration action returns false', async () => {
      const migrationMock = {
        up: jest.fn().mockResolvedValue(false),
      };
      loadMigrationFileSpy.mockResolvedValue(migrationMock);

      const result = await (service as any).runOne({
        version: 'v2.1.9',
        action: 'up',
      });
      expect(result).toBe(false);
      expect(verifyStatusSpy).toHaveBeenCalledWith({
        version: 'v2.1.9',
        action: 'up',
      });
      expect(loadMigrationFileSpy).toHaveBeenCalledWith('v2.1.9');
      expect(migrationMock.up).toHaveBeenCalledWith({
        attachmentService: service['attachmentService'],
        logger: service['logger'],
        http: service['httpService'],
      });
      expect(successCallbackSpy).not.toHaveBeenCalled();
      expect(failureCallbackSpy).not.toHaveBeenCalled();
    });
  });

  describe('runUpgrades', () => {
    let getAvailableUpgradeVersionsSpy: jest.SpyInstance;
    let isNewerVersionSpy: jest.SpyInstance;
    let runOneSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.spyOn(service, 'exit').mockImplementation(); // Mock exit to avoid Jest process termination

      getAvailableUpgradeVersionsSpy = jest
        .spyOn(service as any, 'getAvailableUpgradeVersions')
        .mockReturnValue(['v2.2.0', 'v2.3.0', 'v2.4.0']); // Mock available versions
      isNewerVersionSpy = jest
        .spyOn(service as any, 'isNewerVersion')
        .mockImplementation(
          (v1: string, v2: string) =>
            parseInt(v1.substring(1).replaceAll('.', '')) >
            parseInt(v2.substring(1).replaceAll('.', '')),
        ); // Simplified mock for version comparison
      runOneSpy = jest.spyOn(service as any, 'runOne').mockResolvedValue(true);
    });

    afterEach(jest.restoreAllMocks);

    it('should filter versions and call runOne for each newer version', async () => {
      const result = await (service as any).runUpgrades('up', 'v2.2.0');

      expect(getAvailableUpgradeVersionsSpy).toHaveBeenCalled();
      expect(runOneSpy).toHaveBeenCalledTimes(2); // Only for 'v2.3.0' and 'v2.4.0'
      expect(runOneSpy).toHaveBeenCalledWith({
        version: 'v2.3.0',
        action: 'up',
      });
      expect(runOneSpy).toHaveBeenCalledWith({
        version: 'v2.4.0',
        action: 'up',
      });
      expect(result).toBe('v2.4.0'); // Last processed version
    });

    it('should return the initial version if no newer versions are available', async () => {
      isNewerVersionSpy.mockImplementation(() => false); // Mock to return no newer versions

      const result = await (service as any).runUpgrades('up', 'v2.4.0');

      expect(getAvailableUpgradeVersionsSpy).toHaveBeenCalled();
      expect(isNewerVersionSpy).toHaveBeenCalledTimes(3);
      expect(runOneSpy).not.toHaveBeenCalled();
      expect(result).toBe('v2.4.0'); // Initial version is returned
    });

    it('should handle empty available versions gracefully', async () => {
      getAvailableUpgradeVersionsSpy.mockReturnValue([]);

      const result = await (service as any).runUpgrades('up', 'v2.2.0');

      expect(getAvailableUpgradeVersionsSpy).toHaveBeenCalled();
      expect(isNewerVersionSpy).not.toHaveBeenCalled();
      expect(runOneSpy).not.toHaveBeenCalled();
      expect(result).toBe('v2.2.0'); // Initial version is returned
    });

    it('should propagate errors from runOne', async () => {
      runOneSpy.mockRejectedValue(new Error('Test Error'));

      await expect(
        (service as any).runUpgrades('up', 'v2.2.0'),
      ).rejects.toThrow('Test Error');

      expect(getAvailableUpgradeVersionsSpy).toHaveBeenCalled();
      expect(isNewerVersionSpy).toHaveBeenCalled();
      expect(runOneSpy).toHaveBeenCalledWith({
        version: 'v2.3.0',
        action: 'up',
      });
    });
  });

  it('should return the migration name without the timestamp and file extension', () => {
    const result = (service as any).getMigrationName(
      '1234567890-v-1-0-1.migration.ts',
    );

    expect(result).toBe('v-1-0-1');
  });

  it('should load a valid migration file and return it', async () => {
    const version = 'v2.1.9';

    const mockFiles = ['1234567890-v-2-1-9.migration.js'];
    jest.spyOn(service, 'getMigrationFiles').mockReturnValue(mockFiles);
    const mockMigration = {
      up: jest.fn(),
      down: jest.fn(),
    };

    jest
      .spyOn(service, 'migrationFilePath', 'get')
      .mockReturnValue('/migrations');
    jest.spyOn(service['logger'], 'error').mockImplementation();
    jest.mock(
      `/migrations/1234567890-v-2-1-9.migration.js`,
      () => mockMigration,
      {
        virtual: true,
      },
    );

    const result = await (service as any).loadMigrationFile(version);

    expect(result.default).toBe(mockMigration);
    expect(service['logger'].error).not.toHaveBeenCalled();
  });
});
