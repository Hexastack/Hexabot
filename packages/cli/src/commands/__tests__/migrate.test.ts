/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { jest } from '@jest/globals';
import { Command } from 'commander';

const dockerExec = jest.fn();
const ensureDockerFolder = jest.fn();
const checkDocker = jest.fn();

jest.unstable_mockModule('../../core/docker.js', () => ({
  dockerExec,
}));

jest.unstable_mockModule('../../core/project.js', () => ({
  ensureDockerFolder,
}));

jest.unstable_mockModule('../../core/prerequisites.js', () => ({
  checkDocker,
}));

let registerMigrateCommand: (program: Command) => void;

beforeAll(async () => {
  ({ registerMigrateCommand } = await import('../migrate.js'));
});

describe('registerMigrateCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ensureDockerFolder.mockReturnValue('/workspace/docker');
  });

  it('runs migrations with additional arguments', async () => {
    const program = new Command();
    registerMigrateCommand(program);

    await program.parseAsync(['node', 'test', 'migrate', 'seed', '20241128']);

    expect(ensureDockerFolder).toHaveBeenCalled();
    expect(dockerExec).toHaveBeenCalledWith(
      'api',
      'npm run migrate seed 20241128',
      '--user $(id -u):$(id -g)',
    );
  });

  it('runs migrations without extra arguments', async () => {
    const program = new Command();
    registerMigrateCommand(program);

    await program.parseAsync(['node', 'test', 'migrate']);

    expect(dockerExec).toHaveBeenCalledWith(
      'api',
      'npm run migrate',
      '--user $(id -u):$(id -g)',
    );
  });
});
