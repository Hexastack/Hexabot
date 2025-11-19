/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { jest } from '@jest/globals';
import { Command } from 'commander';

const loadProjectConfig = jest.fn();
const updateProjectConfig = jest.fn();
const normalizePackageManager = jest.fn();
const assertHexabotProject = jest.fn();

jest.unstable_mockModule('../../core/config.js', () => ({
  loadProjectConfig,
  updateProjectConfig,
}));

jest.unstable_mockModule('../../core/package-manager.js', () => ({
  normalizePackageManager,
}));

jest.unstable_mockModule('../../core/project.js', () => ({
  assertHexabotProject,
}));

let registerConfigCommand: (program: Command) => void;

beforeAll(async () => {
  ({ registerConfigCommand } = await import('../config.js'));
});

beforeEach(() => {
  jest.resetAllMocks();
  loadProjectConfig.mockReturnValue({ packageManager: 'npm' });
  normalizePackageManager.mockImplementation((value: unknown) =>
    typeof value === 'string' ? value.toLowerCase() : undefined,
  );
});

describe('registerConfigCommand', () => {
  it('prints the current project config', async () => {
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((message?: string) => {
      logs.push(String(message));
    });
    const program = new Command();
    registerConfigCommand(program);

    await program.parseAsync(['node', 'test', 'config', 'show']);

    expect(logs.some((line) => line.includes('"packageManager"'))).toBe(true);
  });

  it('updates configuration values with automatic parsing', async () => {
    const program = new Command();
    registerConfigCommand(program);

    await program.parseAsync([
      'node',
      'test',
      'config',
      'set',
      'packageManager',
      'PNPM',
    ]);
    expect(normalizePackageManager).toHaveBeenCalledWith('PNPM');
    expect(updateProjectConfig).toHaveBeenCalledWith(expect.any(String), {
      packageManager: 'pnpm',
    });

    await program.parseAsync([
      'node',
      'test',
      'config',
      'set',
      'docker.defaultServices',
      'api, postgres',
    ]);
    expect(updateProjectConfig).toHaveBeenCalledWith(expect.any(String), {
      docker: { defaultServices: ['api', 'postgres'] },
    });

    await program.parseAsync([
      'node',
      'test',
      'config',
      'set',
      'limits.rate',
      '50',
    ]);
    expect(updateProjectConfig).toHaveBeenCalledWith(expect.any(String), {
      limits: { rate: 50 },
    });
  });
});
