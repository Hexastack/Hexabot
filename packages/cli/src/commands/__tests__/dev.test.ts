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

let runDev: (options?: any) => Promise<void>;

beforeAll(async () => {
  ({ runDev } = await import('../dev.js'));
});

beforeEach(() => {
  jest.resetAllMocks();
  normalizePackageManager.mockImplementation((value: unknown) =>
    typeof value === 'string' ? value.toLowerCase() : undefined,
  );
  resolveComposeFile.mockReturnValue('/tmp/docker/docker-compose.yml');
  generateComposeFiles.mockReturnValue('-f docker-compose.yml');
});

const baseConfig = {
  devScript: 'dev',
  startScript: 'start',
  packageManager: 'pnpm',
  docker: {
    composeFile: 'docker/docker-compose.yml',
    defaultServices: ['api'],
  },
  env: {
    local: '.env',
    localExample: '.env.example',
    docker: '.env.docker',
    dockerExample: '.env.docker.example',
  },
};

describe('runDev', () => {
  it('runs the dev script locally with env bootstrapping', async () => {
    loadProjectConfig.mockReturnValue(baseConfig);
    resolveEnvExample.mockReturnValue('.env.custom');

    await runDev({ env: '.env.local' });

    expect(assertHexabotProject).toHaveBeenCalled();
    expect(resolveEnvExample).toHaveBeenCalledWith(
      expect.any(String),
      '.env.local',
      baseConfig.env.localExample,
    );
    expect(bootstrapEnvFile).toHaveBeenCalledWith(
      expect.any(String),
      '.env.custom',
      '.env.local',
    );
    expect(runPackageScript).toHaveBeenCalledWith(
      'pnpm',
      'dev',
      expect.any(String),
    );
    expect(dockerCompose).not.toHaveBeenCalled();
  });

  it('updates the stored package manager when overridden', async () => {
    loadProjectConfig.mockReturnValue({
      ...baseConfig,
      packageManager: 'npm',
    });

    await runDev({ pm: 'yarn', envBootstrap: false });

    expect(updateProjectConfig).toHaveBeenCalledWith(expect.any(String), {
      packageManager: 'yarn',
    });
    expect(bootstrapEnvFile).not.toHaveBeenCalled();
  });

  it('runs docker compose when the docker flag is provided', async () => {
    loadProjectConfig.mockReturnValue(baseConfig);

    await runDev({ docker: true, services: 'api,postgres', detach: true });

    expect(bootstrapEnvFile).toHaveBeenCalledWith(
      expect.any(String),
      baseConfig.env.dockerExample,
      baseConfig.env.docker,
    );
    expect(checkDocker).toHaveBeenCalled();
    expect(ensureDockerFolder).toHaveBeenCalled();
    expect(generateComposeFiles).toHaveBeenCalledWith(
      '/tmp/docker/docker-compose.yml',
      ['api', 'postgres'],
      'dev',
    );
    expect(dockerCompose).toHaveBeenCalledWith(
      expect.stringContaining('up --build -d'),
    );
    expect(runPackageScript).not.toHaveBeenCalled();
  });
});
