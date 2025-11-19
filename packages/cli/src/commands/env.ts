/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import * as path from 'path';

import chalk from 'chalk';
import { Command } from 'commander';

import { loadProjectConfig } from '../core/config.js';
import { bootstrapEnvFile, listEnvStatus } from '../core/env.js';
import { assertHexabotProject } from '../core/project.js';

export const registerEnvCommand = (program: Command) => {
  const envCommand = program.command('env').description('Manage env files');

  envCommand
    .command('init')
    .description('Copy *.example env files')
    .option('--docker', 'Initialize Docker env file')
    .option('--force', 'Overwrite existing env files')
    .action((options: { docker?: boolean; force?: boolean }) => {
      const projectRoot = path.resolve(process.cwd());
      assertHexabotProject(projectRoot);
      const config = loadProjectConfig(projectRoot);

      if (options.docker) {
        bootstrapEnvFile(
          projectRoot,
          config.env.dockerExample,
          config.env.docker,
          { force: options.force },
        );
      } else {
        bootstrapEnvFile(
          projectRoot,
          config.env.localExample,
          config.env.local,
          {
            force: options.force,
          },
        );
      }
    });

  envCommand
    .command('list')
    .description('Show env file status')
    .action(() => {
      const projectRoot = path.resolve(process.cwd());
      assertHexabotProject(projectRoot);
      const config = loadProjectConfig(projectRoot);
      const statuses = listEnvStatus(projectRoot, config);

      statuses.forEach((status) => {
        const symbol = status.exists ? chalk.green('✓') : chalk.red('✗');
        console.log(`${symbol} ${status.file}`);
      });
    });
};
