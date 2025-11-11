/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

jest.mock('nest-commander', () => ({
  Command: () => () => undefined,
  CommandRunner: class {
    async run(): Promise<void> {
      return undefined;
    }
  },
}));

import { MigrationCommand } from './migration.command';
import { MigrationService } from './migration.service';
import { MigrationAction } from './types';

describe('MigrationCommand', () => {
  let command: MigrationCommand;
  let migrationService: jest.Mocked<MigrationService>;
  let logger: { log: jest.Mock; error: jest.Mock };

  beforeEach(() => {
    migrationService = {
      create: jest.fn(),
      run: jest.fn(),
      isValidVersion: jest.fn(),
    } as unknown as jest.Mocked<MigrationService>;

    logger = {
      log: jest.fn(),
      error: jest.fn(),
    };

    command = new MigrationCommand(logger as any, migrationService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should delegate to migrationService.create for the create command', async () => {
    migrationService.isValidVersion.mockReturnValue(true);
    const processExitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);

    await command.run(['create', 'v3.0.0']);

    expect(migrationService.create).toHaveBeenCalledWith('v3.0.0');
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it('should throw a TypeError when create is given an invalid version', async () => {
    migrationService.isValidVersion.mockReturnValue(false);

    await expect(command.run(['create', 'invalid'])).rejects.toThrow(
      new TypeError('Invalid version value.'),
    );
  });

  it('should exit with code 1 when migrate is called with an invalid action', async () => {
    const processExitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);

    await command.run(['migrate', 'sideways']);

    expect(logger.error).toHaveBeenCalledWith('Invalid Operation');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should exit with code 1 when no valid subcommand is provided', async () => {
    const processExitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);

    await command.run([]);

    expect(logger.error).toHaveBeenCalledWith('No valid command provided');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should run migrations when migrate command arguments are valid', async () => {
    migrationService.isValidVersion.mockReturnValue(true);

    await command.run(['migrate', MigrationAction.UP, 'v3.0.1']);

    expect(migrationService.run).toHaveBeenCalledWith({
      action: MigrationAction.UP,
      version: 'v3.0.1',
    });
  });
});
