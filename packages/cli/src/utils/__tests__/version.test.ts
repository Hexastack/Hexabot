/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import fs from 'fs';
import * as path from 'path';

import { jest } from '@jest/globals';

import { getCliVersion } from '../version.js';

describe('getCliVersion', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the version from the package.json file', () => {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    const { version } = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    expect(getCliVersion()).toBe(version);
  });

  it('falls back to the default version when package.json cannot be read', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const failingReader: typeof fs.readFileSync = () => {
      throw new Error('file error');
    };

    expect(getCliVersion(failingReader)).toBe('3.0.0');
    expect(errorSpy).toHaveBeenCalled();
  });
});
