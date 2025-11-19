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

export interface StartOptions {
  docker?: boolean;
  services?: string;
  detach?: boolean;
  build?: boolean;
  env?: string;
  envBootstrap?: boolean;
  pm?: string;
  cwd?: string;
}

export const registerStartCommand = (program: Command) => {
  program
    .command('start')
    .description('Run the project in production mode')
    .option('--docker', 'Run using Docker (production stack)')
    .option('--services <list>', 'Comma-separated services/profiles to enable')
    .option('-d, --detach', 'Detach Docker containers')
    .option('--build', 'Build Docker images before starting')
    .option('--env <file>', 'Env file to use (default: .env)')
    .option('--env-bootstrap', 'Generate env files from *.example if missing')
    .option('--pm <npm|pnpm|yarn|bun>', 'Override package manager')
    .action(async (options: StartOptions) => {
      await runStart(options);
    });
};

export const runStart = async (options: StartOptions = {}) => {
  const projectRoot = path.resolve(options.cwd || process.cwd());
  assertHexabotProject(projectRoot);
  const config = loadProjectConfig(projectRoot);
  const normalizedPm = normalizePackageManager(options.pm);
  const pm =
    normalizedPm || config.packageManager || detectPackageManager(projectRoot);

  if (config.packageManager !== pm) {
    updateProjectConfig(projectRoot, { packageManager: pm });
  }

  const shouldBootstrap = Boolean(options.envBootstrap);
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
    await runDockerStart(projectRoot, options, config);
  } else {
    runPackageScript(pm, config.startScript, projectRoot);
  }
};

const runDockerStart = async (
  projectRoot: string,
  options: StartOptions,
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
  const composeArgs = generateComposeFiles(composeFile, services, 'prod');
  const upArgs = ['up'];
  if (options.build) {
    upArgs.push('--build');
  }
  if (options.detach) {
    upArgs.push('-d');
  }

  const composeCommand = `${composeArgs} ${upArgs.join(' ')}`.trim();
  console.log(
    chalk.blue(
      `Starting Docker services in production mode${
        services.length ? ` (${services.join(', ')})` : ''
      }`,
    ),
  );
  dockerCompose(composeCommand);
};
