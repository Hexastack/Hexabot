/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { jest } from '@jest/globals';
import { Command } from 'commander';

const loadProjectConfig = jest.fn();
const bootstrapEnvFile = jest.fn();
const listEnvStatus = jest.fn();
const assertHexabotProject = jest.fn();

jest.unstable_mockModule('../../core/config.js', () => ({
  loadProjectConfig,
}));

jest.unstable_mockModule('../../core/env.js', () => ({
  bootstrapEnvFile,
  listEnvStatus,
}));

jest.unstable_mockModule('../../core/project.js', () => ({
  assertHexabotProject,
}));

let registerEnvCommand: (program: Command) => void;

beforeAll(async () => {
  ({ registerEnvCommand } = await import('../env.js'));
});

beforeEach(() => {
  jest.resetAllMocks();
  loadProjectConfig.mockReturnValue({
    env: {
      local: '.env',
      localExample: '.env.example',
      docker: '.env.docker',
      dockerExample: '.env.docker.example',
    },
  });
});

describe('registerEnvCommand', () => {
  it('bootstraps env files for docker or local targets', async () => {
    const dockerProgram = new Command();
    registerEnvCommand(dockerProgram);
    await dockerProgram.parseAsync([
      'node',
      'test',
      'env',
      'init',
      '--docker',
      '--force',
    ]);
    expect(bootstrapEnvFile).toHaveBeenCalledWith(
      expect.any(String),
      '.env.docker.example',
      '.env.docker',
      { force: true },
    );

    jest.clearAllMocks();
    const localProgram = new Command();
    registerEnvCommand(localProgram);
    await localProgram.parseAsync(['node', 'test', 'env', 'init']);
    expect(bootstrapEnvFile).toHaveBeenCalledWith(
      expect.any(String),
      '.env.example',
      '.env',
      { force: undefined },
    );
  });

  it('lists env statuses with formatted output', async () => {
    const statuses = [
      { file: '.env', exists: true },
      { file: '.env.docker', exists: false },
    ];
    listEnvStatus.mockReturnValue(statuses);
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((message?: string) => {
      logs.push(String(message));
    });

    const program = new Command();
    registerEnvCommand(program);
    await program.parseAsync(['node', 'test', 'env', 'list']);

    expect(logs.join('\n')).toContain('.env');
    expect(logs.join('\n')).toContain('.env.docker');
  });
});
