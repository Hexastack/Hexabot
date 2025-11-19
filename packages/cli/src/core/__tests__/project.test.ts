/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { jest } from '@jest/globals';

import { ensureDockerFolder, resolveDockerFolder } from '../project.js';

describe('project helpers', () => {
  let tempDirs: string[] = [];

  afterEach(() => {
    jest.restoreAllMocks();
    tempDirs.forEach((dir) =>
      fs.rmSync(dir, {
        recursive: true,
        force: true,
      }),
    );
    tempDirs = [];
  });

  const createTempDir = (withDockerFolder: boolean) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexabot-project-'));
    tempDirs.push(dir);
    if (withDockerFolder) {
      fs.mkdirSync(path.join(dir, 'docker'));
    }

    return dir;
  };

  it('resolves the docker folder relative to the working directory', () => {
    jest.spyOn(process, 'cwd').mockReturnValue('/workspace/hexabot');

    expect(resolveDockerFolder()).toBe(
      path.resolve('/workspace/hexabot', './docker'),
    );
  });

  it('returns the folder path when it exists', () => {
    const cwd = createTempDir(true);
    jest.spyOn(process, 'cwd').mockReturnValue(cwd);

    expect(ensureDockerFolder()).toBe(path.resolve(cwd, './docker'));
  });

  it('exits the process when the docker folder is missing', () => {
    const cwd = createTempDir(false);
    jest.spyOn(process, 'cwd').mockReturnValue(cwd);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(((
      code?: string | number | null | undefined,
    ) => {
      throw new Error(`exit:${code}`);
    }) as (code?: string | number | null | undefined) => never);

    expect(() => ensureDockerFolder()).toThrow('exit:1');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
