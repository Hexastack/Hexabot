/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import * as path from 'path';

import chalk from 'chalk';
import { Command } from 'commander';

import { loadProjectConfig, updateProjectConfig } from '../core/config.js';
import {
  dockerCompose,
  generateComposeFiles,
  resolveComposeFile,
} from '../core/docker.js';
import { bootstrapEnvFile, resolveEnvExample } from '../core/env.js';
import {
  detectPackageManager,
  normalizePackageManager,
  runPackageScript,
} from '../core/package-manager.js';
import { checkDocker } from '../core/prerequisites.js';
import { assertHexabotProject, ensureDockerFolder } from '../core/project.js';
import { parseServices } from '../utils/services.js';

export interface DevOptions {
  docker?: boolean;
  services?: string;
  detach?: boolean;
  env?: string;
  envBootstrap?: boolean;
  pm?: string;
  cwd?: string;
}

export const registerDevCommand = (program: Command) => {
  program
    .command('dev')
    .description('Run the current Hexabot project in development mode')
    .option('--docker', 'Run using Docker')
    .option(
      '--services <list>',
      'Comma-separated services or profiles to enable',
    )
    .option('-d, --detach', 'Detach Docker containers (Docker mode only)')
    .option('--env <file>', 'Env file to use for local dev (default: .env)')
    .option('--no-env-bootstrap', 'Skip env bootstrapping')
    .option('--pm <npm|pnpm|yarn|bun>', 'Override package manager')
    .action(async (options: DevOptions) => {
      await runDev(options);
    });
};

export const runDev = async (options: DevOptions = {}) => {
  const projectRoot = path.resolve(options.cwd || process.cwd());
  assertHexabotProject(projectRoot);
  const config = loadProjectConfig(projectRoot);
  const normalizedPm = normalizePackageManager(options.pm);
  const pm =
    normalizedPm || config.packageManager || detectPackageManager(projectRoot);

  if (config.packageManager !== pm) {
    updateProjectConfig(projectRoot, { packageManager: pm });
  }

  const shouldBootstrap = options.envBootstrap !== false;
  if (shouldBootstrap) {
    if (options.docker) {
      bootstrapEnvFile(
        projectRoot,
        config.env.dockerExample,
        config.env.docker,
      );
    } else {
      const envFile = options.env || config.env.local;
      const envExample = resolveEnvExample(
        projectRoot,
        envFile,
        config.env.localExample,
      );
      bootstrapEnvFile(projectRoot, envExample, envFile);
    }
  }

  if (options.docker) {
    await runDockerDev(projectRoot, options, config);
  } else {
    runPackageScript(pm, config.devScript, projectRoot);
  }
};

const runDockerDev = async (
  projectRoot: string,
  options: DevOptions,
  config: ReturnType<typeof loadProjectConfig>,
) => {
  checkDocker({ silent: true });
  ensureDockerFolder(projectRoot);
  const servicesInput = parseServices(options.services || '');
  const services = servicesInput.length
    ? servicesInput
    : config.docker.defaultServices;
  const composeFile = resolveComposeFile(
    projectRoot,
    config.docker.composeFile,
  );
  const composeArgs = generateComposeFiles(composeFile, services, 'dev');
  const upArgs = ['up', '--build'];
  if (options.detach) {
    upArgs.push('-d');
  }

  const composeCommand = `${composeArgs} ${upArgs.join(' ')}`.trim();
  console.log(
    chalk.blue(
      `Starting Docker services${services.length ? ` (${services.join(', ')})` : ''}`,
    ),
  );
  dockerCompose(composeCommand);
};
