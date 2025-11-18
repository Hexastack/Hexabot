/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import * as fs from 'fs';
import * as path from 'path';

import chalk from 'chalk';
import { Command } from 'commander';

import { ensureDockerFolder } from '../core/project.js';

export const registerInitCommand = (program: Command) => {
  program
    .command('init')
    .description('Initialize the environment by copying .env.example to .env')
    .action(() => {
      const dockerFolder = ensureDockerFolder();
      const envPath = path.join(dockerFolder, '.env');
      const exampleEnvPath = path.join(dockerFolder, '.env.example');

      if (fs.existsSync(envPath)) {
        console.log(chalk.yellow('.env file already exists.'));
        return;
      }

      fs.copyFileSync(exampleEnvPath, envPath);
      console.log(chalk.green('Copied .env.example to .env'));
    });
};
