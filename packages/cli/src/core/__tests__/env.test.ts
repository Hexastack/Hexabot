/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { jest } from '@jest/globals';

import {
  bootstrapEnvFile,
  listEnvStatus,
  resolveEnvExample,
} from '../env.js';

describe('env helpers', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexabot-env-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('copies the example env file when the target is missing', () => {
    const example = '.env.example';
    const target = '.env';
    fs.writeFileSync(path.join(tempDir, example), 'KEY=value');

    const result = bootstrapEnvFile(tempDir, example, target);

    expect(result).toBe(true);
    expect(fs.readFileSync(path.join(tempDir, target), 'utf-8')).toBe(
      'KEY=value',
    );
  });

  it('skips copying when the target exists unless forced', () => {
    const example = '.env.example';
    const target = '.env';
    fs.writeFileSync(path.join(tempDir, example), 'NEW=value');
    fs.writeFileSync(path.join(tempDir, target), 'OLD=value');
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const skipped = bootstrapEnvFile(tempDir, example, target, { quiet: false });
    expect(skipped).toBe(false);
    expect(fs.readFileSync(path.join(tempDir, target), 'utf-8')).toBe(
      'OLD=value',
    );
    expect(logSpy).toHaveBeenCalled();

    const forced = bootstrapEnvFile(tempDir, example, target, { force: true });
    expect(forced).toBe(true);
    expect(fs.readFileSync(path.join(tempDir, target), 'utf-8')).toBe(
      'NEW=value',
    );
  });

  it('lists env file statuses using the provided config', () => {
    const config = {
      env: {
        local: '.env',
        localExample: '.env.example',
        docker: '.env.docker',
        dockerExample: '.env.docker.example',
      },
    } as const;
    fs.writeFileSync(path.join(tempDir, '.env.example'), '');
    fs.writeFileSync(path.join(tempDir, '.env'), '');

    const statuses = listEnvStatus(tempDir, config as any);

    expect(statuses).toEqual([
      expect.objectContaining({ file: '.env.example', exists: true }),
      expect.objectContaining({ file: '.env', exists: true }),
      expect.objectContaining({ file: '.env.docker.example', exists: false }),
      expect.objectContaining({ file: '.env.docker', exists: false }),
    ]);
  });

  it('resolves env example files relative to the project root', () => {
    const envFile = '.env.local';
    const defaultExample = '.env.example';
    const examplePath = path.join(tempDir, `${envFile}.example`);
    fs.writeFileSync(examplePath, '');

    expect(resolveEnvExample(tempDir, envFile, defaultExample)).toBe(
      `${envFile}.example`,
    );
    expect(
      resolveEnvExample(tempDir, '.missing', defaultExample),
    ).toBe(defaultExample);
  });
});
