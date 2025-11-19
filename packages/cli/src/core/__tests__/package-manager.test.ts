/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { jest } from '@jest/globals';

const readPackageJson = jest.fn();
const execSync = jest.fn();

jest.unstable_mockModule('../project.js', () => ({
  readPackageJson,
}));

jest.unstable_mockModule('child_process', () => ({
  execSync,
}));

type PackageManagerModule = typeof import('../package-manager.js');
let normalizePackageManager: PackageManagerModule['normalizePackageManager'];
let detectPackageManager: PackageManagerModule['detectPackageManager'];
let runPackageScript: PackageManagerModule['runPackageScript'];
let installDependencies: PackageManagerModule['installDependencies'];

beforeAll(async () => {
  ({
    normalizePackageManager,
    detectPackageManager,
    runPackageScript,
    installDependencies,
  } = await import('../package-manager.js'));
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('normalizePackageManager', () => {
  it('returns normalized package manager names', () => {
    expect(normalizePackageManager('PNPM')).toBe('pnpm');
    expect(normalizePackageManager(undefined)).toBeUndefined();
  });

  it('exits when the package manager is unsupported', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit:1');
    }) as () => never);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => normalizePackageManager('foo')).toThrow('exit:1');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

describe('detectPackageManager', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexabot-pm-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('detects the package manager based on lockfiles', () => {
    fs.writeFileSync(path.join(tempDir, 'pnpm-lock.yaml'), '');

    expect(detectPackageManager(tempDir)).toBe('pnpm');
  });

  it('falls back to npm when no lockfiles are found', () => {
    expect(detectPackageManager(tempDir)).toBe('npm');
  });
});

describe('installDependencies & runPackageScript', () => {
  const projectRoot = '/tmp/project';

  beforeEach(() => {
    readPackageJson.mockReturnValue({
      scripts: {
        build: 'tsc',
      },
    });
  });

  it('runs installation commands for the chosen package manager', () => {
    installDependencies('yarn', projectRoot);

    expect(execSync).toHaveBeenCalledWith('yarn install', {
      cwd: projectRoot,
      stdio: 'inherit',
    });
  });

  it('runs package scripts after ensuring the script exists', () => {
    runPackageScript('pnpm', 'build', projectRoot, ['--watch']);

    expect(execSync).toHaveBeenCalledWith('pnpm run build -- --watch', {
      cwd: projectRoot,
      stdio: 'inherit',
    });
  });

  it('exits when the script is missing from package.json', () => {
    readPackageJson.mockReturnValue({ scripts: {} });
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit:1');
    }) as () => never);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => runPackageScript('npm', 'dev', projectRoot)).toThrow('exit:1');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
