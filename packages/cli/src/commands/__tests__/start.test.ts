/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { jest } from '@jest/globals';

const loadProjectConfig = jest.fn();
const updateProjectConfig = jest.fn();
const dockerCompose = jest.fn();
const generateComposeFiles = jest.fn();
const resolveComposeFile = jest.fn();
const bootstrapEnvFile = jest.fn();
const resolveEnvExample = jest.fn();
const detectPackageManager = jest.fn();
const normalizePackageManager = jest.fn();
const runPackageScript = jest.fn();
const checkDocker = jest.fn();
const assertHexabotProject = jest.fn();
const ensureDockerFolder = jest.fn();

jest.unstable_mockModule('../../core/config.js', () => ({
  loadProjectConfig,
  updateProjectConfig,
}));

jest.unstable_mockModule('../../core/docker.js', () => ({
  dockerCompose,
  generateComposeFiles,
  resolveComposeFile,
}));

jest.unstable_mockModule('../../core/env.js', () => ({
  bootstrapEnvFile,
  resolveEnvExample,
}));

jest.unstable_mockModule('../../core/package-manager.js', () => ({
  detectPackageManager,
  normalizePackageManager,
  runPackageScript,
}));

jest.unstable_mockModule('../../core/prerequisites.js', () => ({
  checkDocker,
}));

jest.unstable_mockModule('../../core/project.js', () => ({
  assertHexabotProject,
  ensureDockerFolder,
}));

jest.unstable_mockModule('../../utils/services.js', () => ({
  parseServices: (value: string) => value.split(',').filter(Boolean),
}));

let runStart: (options?: any) => Promise<void>;

beforeAll(async () => {
  ({ runStart } = await import('../start.js'));
});

beforeEach(() => {
  jest.resetAllMocks();
  normalizePackageManager.mockImplementation(
    (value: unknown) => value as string | undefined,
  );
});

describe('runStart', () => {
  const baseConfig = {
    startScript: 'start',
    packageManager: 'npm',
    docker: {
      composeFile: 'docker/docker-compose.yml',
      defaultServices: [],
    },
    env: {
      local: '.env',
      localExample: '.env.example',
      docker: '.env.docker',
      dockerExample: '.env.docker.example',
    },
  };

  it('runs the npm start script when not using Docker', async () => {
    loadProjectConfig.mockReturnValue(baseConfig);

    await runStart();

    expect(assertHexabotProject).toHaveBeenCalled();
    expect(runPackageScript).toHaveBeenCalledWith(
      'npm',
      'start',
      expect.any(String),
    );
    expect(detectPackageManager).not.toHaveBeenCalled();
    expect(updateProjectConfig).not.toHaveBeenCalled();
    expect(dockerCompose).not.toHaveBeenCalled();
  });

  it('runs docker compose in prod mode with env bootstrap', async () => {
    const config = {
      ...baseConfig,
      packageManager: undefined,
      docker: {
        composeFile: 'docker/docker-compose.yml',
        defaultServices: ['api'],
      },
    };
    loadProjectConfig.mockReturnValue(config);
    detectPackageManager.mockReturnValue('pnpm');
    resolveComposeFile.mockReturnValue('/tmp/docker/docker-compose.yml');
    generateComposeFiles.mockReturnValue('-f docker-compose.yml');

    await runStart({
      docker: true,
      services: 'api,postgres',
      envBootstrap: true,
      build: true,
      detach: true,
    });

    expect(detectPackageManager).toHaveBeenCalled();
    expect(updateProjectConfig).toHaveBeenCalledWith(expect.any(String), {
      packageManager: 'pnpm',
    });
    expect(bootstrapEnvFile).toHaveBeenCalledWith(
      expect.any(String),
      config.env.dockerExample,
      config.env.docker,
    );
    expect(resolveEnvExample).not.toHaveBeenCalled();
    expect(checkDocker).toHaveBeenCalled();
    expect(ensureDockerFolder).toHaveBeenCalled();
    expect(generateComposeFiles).toHaveBeenCalledWith(
      '/tmp/docker/docker-compose.yml',
      ['api', 'postgres'],
      'prod',
    );
    expect(dockerCompose).toHaveBeenCalledWith(
      expect.stringContaining('up --build -d'),
    );
    expect(runPackageScript).not.toHaveBeenCalled();
  });

  it('bootstraps envs for local start when requested', async () => {
    loadProjectConfig.mockReturnValue(baseConfig);
    resolveEnvExample.mockReturnValue('.env.local.example');

    await runStart({ envBootstrap: true, env: '.env.local' });

    expect(resolveEnvExample).toHaveBeenCalledWith(
      expect.any(String),
      '.env.local',
      baseConfig.env.localExample,
    );
    expect(bootstrapEnvFile).toHaveBeenCalledWith(
      expect.any(String),
      '.env.local.example',
      '.env.local',
    );
    expect(runPackageScript).toHaveBeenCalled();
  });
});
