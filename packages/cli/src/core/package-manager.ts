/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import chalk from 'chalk';

import { readPackageJson } from './project.js';

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

const PACKAGE_MANAGER_LOCKFILES: Record<PackageManager, string> = {
  npm: 'package-lock.json',
  pnpm: 'pnpm-lock.yaml',
  yarn: 'yarn.lock',
  bun: 'bun.lockb',
};

export const normalizePackageManager = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const normalized = value.toLowerCase() as PackageManager;
  if (!Object.keys(PACKAGE_MANAGER_LOCKFILES).includes(normalized)) {
    console.error(
      chalk.red(
        `Unsupported package manager "${value}". Use npm, pnpm, yarn, or bun.`,
      ),
    );
    process.exit(1);
  }

  return normalized;
};

export const detectPackageManager = (projectRoot = process.cwd()) => {
  const entries = Object.entries(PACKAGE_MANAGER_LOCKFILES) as [
    PackageManager,
    string,
  ][];

  for (const [pm, lockfile] of entries) {
    if (fs.existsSync(path.join(projectRoot, lockfile))) {
      return pm;
    }
  }

  return 'npm';
};

export const installDependencies = (
  pm: PackageManager,
  projectRoot = process.cwd(),
) => {
  const command = getInstallCommand(pm);
  runCommand(command, projectRoot);
};

export const runPackageScript = (
  pm: PackageManager,
  script: string,
  projectRoot = process.cwd(),
  scriptArgs: string[] = [],
) => {
  ensureScriptExists(script, projectRoot);
  const command = getRunScriptCommand(pm, script, scriptArgs);
  runCommand(command, projectRoot);
};

const ensureScriptExists = (script: string, projectRoot: string) => {
  const packageJson = readPackageJson(projectRoot);
  if (!packageJson?.scripts?.[script]) {
    console.error(
      chalk.red(
        `Cannot find script "${script}" in package.json. Update hexabot.config.json or package.json scripts.`,
      ),
    );
    process.exit(1);
  }
};
const getInstallCommand = (pm: PackageManager) => {
  switch (pm) {
    case 'pnpm':
      return 'pnpm install';
    case 'yarn':
      return 'yarn install';
    case 'bun':
      return 'bun install';
    default:
      return 'npm install';
  }
};
const getRunScriptCommand = (
  pm: PackageManager,
  script: string,
  args: string[],
) => {
  const joinedArgs = args.join(' ');

  switch (pm) {
    case 'pnpm':
      return joinedArgs
        ? `pnpm run ${script} -- ${joinedArgs}`
        : `pnpm run ${script}`;
    case 'yarn':
      return joinedArgs ? `yarn ${script} ${joinedArgs}` : `yarn ${script}`;
    case 'bun':
      return joinedArgs
        ? `bun run ${script} ${joinedArgs}`
        : `bun run ${script}`;
    default:
      return joinedArgs
        ? `npm run ${script} -- ${joinedArgs}`
        : `npm run ${script}`;
  }
};
const runCommand = (command: string, projectRoot: string) => {
  console.log(chalk.cyan(command));
  execSync(command, { cwd: projectRoot, stdio: 'inherit' });
};
