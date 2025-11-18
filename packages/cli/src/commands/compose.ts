/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Command } from 'commander';

import {
  dockerCompose,
  generateComposeFiles,
  ComposeMode,
} from '../core/docker.js';
import { ensureDockerFolder } from '../core/project.js';
import { parseServices } from '../utils/services.js';

type ComposeLifecycle = 'up' | 'up-build' | 'down' | 'down-volumes';

interface ComposeCommandDefinition {
  command: string;
  description: string;
  lifecycle: ComposeLifecycle;
  mode?: ComposeMode;
}

export const registerComposeCommands = (program: Command) => {
  composeCommandDefinitions.forEach((definition) => {
    program
      .command(definition.command)
      .description(definition.description)
      .option(
        '--services <services>',
        'Comma-separated list of services to enable',
        '',
      )
      .action((options: { services: string }) => {
        runComposeCommand(options.services, definition);
      });
  });
};

const composeCommandDefinitions: ComposeCommandDefinition[] = [
  {
    command: 'start',
    description: 'Start specified services with Docker Compose',
    lifecycle: 'up',
  },
  {
    command: 'dev',
    description:
      'Start specified services in development mode with Docker Compose',
    lifecycle: 'up-build',
    mode: 'dev',
  },
  {
    command: 'start-prod',
    description:
      'Start specified services in production mode with Docker Compose',
    lifecycle: 'up',
    mode: 'prod',
  },
  {
    command: 'stop',
    description: 'Stop specified Docker Compose services',
    lifecycle: 'down',
  },
  {
    command: 'destroy',
    description: 'Destroy specified Docker Compose services and remove volumes',
    lifecycle: 'down-volumes',
  },
];
const runComposeCommand = (
  servicesInput: string,
  definition: ComposeCommandDefinition,
) => {
  const dockerFolder = ensureDockerFolder();
  const services = parseServices(servicesInput || '');
  const composeArgs = generateComposeFiles(
    dockerFolder,
    services,
    definition.mode,
  );
  const lifecycleArgs = resolveLifecycleArgs(definition.lifecycle);
  dockerCompose(`${composeArgs} ${lifecycleArgs}`);
};
const resolveLifecycleArgs = (lifecycle: ComposeLifecycle) => {
  switch (lifecycle) {
    case 'up':
      return 'up -d';
    case 'up-build':
      return 'up --build -d';
    case 'down':
      return 'down';
    case 'down-volumes':
      return 'down -v';
    default:
      return '';
  }
};
