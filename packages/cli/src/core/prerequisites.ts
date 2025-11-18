/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { execSync } from 'child_process';

import chalk from 'chalk';

const REQUIRED_NODE_VERSION = '20.18.1';

export const checkPrerequisites = () => {
  checkDocker();
  checkNodeVersion();
};

const checkDocker = () => {
  try {
    const dockerVersion = execSync('docker --version', { encoding: 'utf-8' });
    console.log(chalk.green(`Docker is installed: ${dockerVersion.trim()}`));
  } catch (_error) {
    console.error(chalk.red('Docker is not installed. Please install Docker.'));
    process.exit(1);
  }
};
const checkNodeVersion = () => {
  try {
    const nodeVersion = execSync('node --version', {
      encoding: 'utf-8',
    }).trim();
    const currentNodeVersion = nodeVersion.startsWith('v')
      ? nodeVersion.slice(1)
      : nodeVersion;

    if (compareVersions(currentNodeVersion, REQUIRED_NODE_VERSION) >= 0) {
      console.log(chalk.green(`Node.js version is sufficient: ${nodeVersion}`));

      return;
    }

    console.error(
      chalk.red(
        `Node.js version must be at least ${REQUIRED_NODE_VERSION}. Current version: ${nodeVersion}. Please install or upgrade Node.js.`,
      ),
    );
    process.exit(1);
  } catch (_error) {
    console.error(
      chalk.red(
        "Node.js is is not accessible or is not installed correctly. Please install Node.js version 20.18.1 or higher and ensure it is in your system's PATH.",
      ),
    );
    process.exit(1);
  }
};
const compareVersions = (current: string, required: string) => {
  const currentParts = current.split('.').map(Number);
  const requiredParts = required.split('.').map(Number);

  for (let i = 0; i < requiredParts.length; i++) {
    if (currentParts[i] > requiredParts[i]) {
      return 1;
    } else if (currentParts[i] < requiredParts[i]) {
      return -1;
    }
  }

  return 0;
};
