/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {
  ensureProjectConfig,
  loadProjectConfig,
  resolveConfigPath,
  updateProjectConfig,
} from '../config.js';
import type { HexabotConfig } from '../config.js';

describe('project config helpers', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexabot-config-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('loads default values when the config file is missing', () => {
    const config = loadProjectConfig(tempDir);

    expect(config).toMatchObject({
      devScript: 'dev',
      startScript: 'start',
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
    });
  });

  it('merges overrides from the config file', () => {
    const override: Partial<HexabotConfig> = {
      devScript: 'custom-dev',
      docker: {
        composeFile: 'docker/compose.override.yml',
        defaultServices: ['api', 'postgres'],
      },
      env: {
        local: '.env.dev',
        localExample: '.env.example',
        docker: '.env.docker',
        dockerExample: '.env.docker.example',
      },
    };
    fs.writeFileSync(resolveConfigPath(tempDir), JSON.stringify(override));

    const config = loadProjectConfig(tempDir);

    expect(config.devScript).toBe('custom-dev');
    expect(config.docker).toMatchObject({
      composeFile: 'docker/compose.override.yml',
      defaultServices: ['api', 'postgres'],
    });
    expect(config.env.local).toBe('.env.dev');
    expect(config.env.localExample).toBe('.env.example');
  });

  it('creates a config file when ensuring one with overrides', () => {
    const overrides: Partial<HexabotConfig> = {
      packageManager: 'pnpm',
      env: {
        local: '.env.dev',
        localExample: '.env.example',
        docker: '.env.docker',
        dockerExample: '.env.docker.example',
      },
    };
    const config = ensureProjectConfig(tempDir, overrides);

    expect(config.packageManager).toBe('pnpm');
    expect(
      JSON.parse(fs.readFileSync(resolveConfigPath(tempDir), 'utf-8')),
    ).toMatchObject({
      packageManager: 'pnpm',
      env: expect.objectContaining({ local: '.env.dev' }),
    });
  });

  it('updates existing config files by merging overrides', () => {
    fs.writeFileSync(
      resolveConfigPath(tempDir),
      JSON.stringify({ startScript: 'serve' }),
    );

    const updated = updateProjectConfig(tempDir, {
      docker: {
        composeFile: 'docker/docker-compose.yml',
        defaultServices: ['api'],
      },
    });

    expect(updated.startScript).toBe('serve');
    expect(updated.docker.defaultServices).toEqual(['api']);
    expect(updated.env.local).toBe('.env');
  });
});
