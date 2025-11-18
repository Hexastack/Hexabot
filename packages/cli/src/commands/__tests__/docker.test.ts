/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { jest } from '@jest/globals';
import { Command } from 'commander';

const loadProjectConfig = jest.fn();
const dockerCompose = jest.fn();
const generateComposeFiles = jest.fn();
const resolveComposeFile = jest.fn();
const bootstrapEnvFile = jest.fn();
const checkDocker = jest.fn();
const assertHexabotProject = jest.fn();
const ensureDockerFolder = jest.fn();
const parseServices = jest.fn();
const runStart = jest.fn();

jest.unstable_mockModule('../../core/config.js', () => ({
  loadProjectConfig,
}));

jest.unstable_mockModule('../../core/docker.js', () => ({
  dockerCompose,
  generateComposeFiles,
  resolveComposeFile,
}));

jest.unstable_mockModule('../../core/env.js', () => ({
  bootstrapEnvFile,
}));

jest.unstable_mockModule('../../core/prerequisites.js', () => ({
  checkDocker,
}));

jest.unstable_mockModule('../../core/project.js', () => ({
  assertHexabotProject,
  ensureDockerFolder,
}));

jest.unstable_mockModule('../../utils/services.js', () => ({
  parseServices,
}));

jest.unstable_mockModule('../start.js', () => ({
  runStart,
}));

let registerDockerCommand: (program: Command) => void;

beforeAll(async () => {
  ({ registerDockerCommand } = await import('../docker.js'));
});

beforeEach(() => {
  jest.resetAllMocks();
  parseServices.mockImplementation((value: unknown) =>
    (typeof value === 'string' ? value : '')
      .split(',')
      .filter((entry) => entry),
  );
  resolveComposeFile.mockReturnValue('/project/docker/docker-compose.yml');
  generateComposeFiles.mockReturnValue('-f docker-compose.yml');
  loadProjectConfig.mockReturnValue({
    docker: {
      composeFile: 'docker/docker-compose.yml',
      defaultServices: ['api'],
    },
    env: {
      docker: '.env.docker',
      dockerExample: '.env.docker.example',
    },
  });
});

const createProgram = () => {
  const program = new Command();
  registerDockerCommand(program);

  return program;
};

describe('registerDockerCommand', () => {
  it('runs docker compose up with extra flags and services', async () => {
    const program = createProgram();
    await program.parseAsync([
      'node',
      'test',
      'docker',
      'up',
      '--services',
      'api,postgres',
      '--build',
      '--detach',
    ]);

    expect(bootstrapEnvFile).toHaveBeenCalled();
    expect(generateComposeFiles).toHaveBeenCalledWith(
      '/project/docker/docker-compose.yml',
      ['api', 'postgres'],
      'dev',
    );
    expect(dockerCompose).toHaveBeenCalledWith(
      expect.stringContaining('up --build -d'),
    );
  });

  it('runs docker compose down with optional volume removal', async () => {
    const program = createProgram();
    await program.parseAsync([
      'node',
      'test',
      'docker',
      'down',
      '--volumes',
    ]);

    expect(dockerCompose).toHaveBeenCalledWith(
      expect.stringContaining('down -v'),
    );
    expect(bootstrapEnvFile).not.toHaveBeenCalled();
  });

  it('tails docker logs with filters', async () => {
    const program = createProgram();
    await program.parseAsync([
      'node',
      'test',
      'docker',
      'logs',
      'api',
      '--follow',
      '--since',
      '1h',
    ]);

    expect(dockerCompose).toHaveBeenCalledWith(
      expect.stringContaining('logs -f --since 1h api'),
    );
  });

  it('lists running services with docker ps', async () => {
    const program = createProgram();
    await program.parseAsync(['node', 'test', 'docker', 'ps']);

    expect(dockerCompose).toHaveBeenCalledWith(
      expect.stringContaining('ps'),
    );
  });

  it('delegates to start command for docker start', async () => {
    const program = createProgram();
    await program.parseAsync([
      'node',
      'test',
      'docker',
      'start',
      '--services',
      'api',
      '--build',
      '--detach',
      '--env-bootstrap',
    ]);

    expect(runStart).toHaveBeenCalledWith({
      docker: true,
      services: 'api',
      build: true,
      detach: true,
      envBootstrap: true,
    });
  });
});
