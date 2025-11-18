/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import * as path from 'path';

import { Command } from 'commander';

import { loadProjectConfig } from '../core/config.js';
import {
  dockerCompose,
  generateComposeFiles,
  resolveComposeFile,
} from '../core/docker.js';
import { bootstrapEnvFile } from '../core/env.js';
import { checkDocker } from '../core/prerequisites.js';
import { assertHexabotProject, ensureDockerFolder } from '../core/project.js';
import { parseServices } from '../utils/services.js';

import { runStart } from './start.js';

export const registerDockerCommand = (program: Command) => {
  const dockerCommand = program.command('docker').description('Docker helpers');

  dockerCommand
    .command('up')
    .description('Start Docker services')
    .option('--services <list>', 'Comma-separated services/profiles')
    .option('-d, --detach', 'Run containers in the background')
    .option('--build', 'Build images before starting')
    .action(
      (options: { services?: string; detach?: boolean; build?: boolean }) =>
        runDockerCommand('up', options),
    );

  dockerCommand
    .command('down')
    .description('Stop Docker services')
    .option('--services <list>', 'Comma-separated services/profiles')
    .option('--volumes', 'Remove volumes')
    .action((options: { services?: string; volumes?: boolean }) =>
      runDockerCommand('down', options),
    );

  dockerCommand
    .command('logs [service]')
    .description('View Docker logs')
    .option('-f, --follow', 'Follow logs')
    .option('--since <time>', 'Only show logs since time (e.g. 1h)')
    .action(
      (
        service: string | undefined,
        options: { follow?: boolean; since?: string },
      ) => runDockerLogs(service, options),
    );

  dockerCommand
    .command('ps')
    .description('List running services')
    .action(() => runDockerPs());

  dockerCommand
    .command('start')
    .description('Start Docker services in production mode')
    .option('--services <list>', 'Comma-separated services/profiles')
    .option('-d, --detach', 'Run containers in the background')
    .option('--build', 'Build images before starting')
    .option('--env-bootstrap', 'Generate env files from *.example if missing')
    .action(
      async (options: {
        services?: string;
        detach?: boolean;
        build?: boolean;
        envBootstrap?: boolean;
      }) => {
        await runStart({
          docker: true,
          services: options.services,
          detach: options.detach,
          build: options.build,
          envBootstrap: options.envBootstrap,
        });
      },
    );
};

const runDockerCommand = (
  lifecycle: 'up' | 'down',
  options: {
    services?: string;
    detach?: boolean;
    build?: boolean;
    volumes?: boolean;
  },
) => {
  const projectRoot = path.resolve(process.cwd());
  assertHexabotProject(projectRoot);
  checkDocker({ silent: true });
  const config = loadProjectConfig(projectRoot);
  ensureDockerFolder(projectRoot);
  const services = resolveServices(options.services, config);
  const composeFile = resolveComposeFile(
    projectRoot,
    config.docker.composeFile,
  );
  const composeArgs = generateComposeFiles(
    composeFile,
    services,
    lifecycle === 'up' ? 'dev' : undefined,
  );

  if (lifecycle === 'up') {
    bootstrapEnvFile(projectRoot, config.env.dockerExample, config.env.docker, {
      quiet: true,
    });
    const commandArgs = ['up'];
    if (options.build) {
      commandArgs.push('--build');
    }
    if (options.detach) {
      commandArgs.push('-d');
    }
    dockerCompose(`${composeArgs} ${commandArgs.join(' ')}`.trim());
  } else {
    const commandArgs = ['down'];
    if (options.volumes) {
      commandArgs.push('-v');
    }
    dockerCompose(`${composeArgs} ${commandArgs.join(' ')}`.trim());
  }
};
const runDockerLogs = (
  service: string | undefined,
  options: { follow?: boolean; since?: string },
) => {
  const projectRoot = path.resolve(process.cwd());
  assertHexabotProject(projectRoot);
  checkDocker({ silent: true });
  const config = loadProjectConfig(projectRoot);
  ensureDockerFolder(projectRoot);
  const composeFile = resolveComposeFile(
    projectRoot,
    config.docker.composeFile,
  );
  const composeArgs = generateComposeFiles(
    composeFile,
    config.docker.defaultServices,
    'dev',
  );
  const args = ['logs'];
  if (options.follow) {
    args.push('-f');
  }
  if (options.since) {
    args.push(`--since ${options.since}`);
  }
  if (service) {
    args.push(service);
  }

  dockerCompose(`${composeArgs} ${args.join(' ')}`.trim());
};
const runDockerPs = () => {
  const projectRoot = path.resolve(process.cwd());
  assertHexabotProject(projectRoot);
  checkDocker({ silent: true });
  const config = loadProjectConfig(projectRoot);
  ensureDockerFolder(projectRoot);
  const composeFile = resolveComposeFile(
    projectRoot,
    config.docker.composeFile,
  );
  const composeArgs = generateComposeFiles(
    composeFile,
    config.docker.defaultServices,
    'dev',
  );

  dockerCompose(`${composeArgs} ps`);
};
const resolveServices = (
  servicesInput: string | undefined,
  config: ReturnType<typeof loadProjectConfig>,
) => {
  const provided = parseServices(servicesInput || '');

  return provided.length ? provided : config.docker.defaultServices;
};
