/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Command } from 'commander';

import { dockerExec } from '../core/docker.js';
import { ensureDockerFolder } from '../core/project.js';

export const registerMigrateCommand = (program: Command) => {
  program
    .command('migrate [args...]')
    .description('Run database migrations')
    .action((args: string[] = []) => {
      ensureDockerFolder();
      const migrateArgs = args.join(' ').trim();
      const command = migrateArgs ? `npm run migrate ${migrateArgs}` : 'npm run migrate';

      dockerExec('api', command, '--user $(id -u):$(id -g)');
    });
};
