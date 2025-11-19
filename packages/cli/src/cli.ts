/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Command } from 'commander';

import { registerCheckCommand } from './commands/check.js';
import { registerConfigCommand } from './commands/config.js';
import { registerCreateCommand } from './commands/create.js';
import { registerDevCommand } from './commands/dev.js';
import { registerDockerCommand } from './commands/docker.js';
import { registerEnvCommand } from './commands/env.js';
import { registerMigrateCommand } from './commands/migrate.js';
import { registerStartCommand } from './commands/start.js';
import { getCliVersion } from './utils/version.js';

export const createCliProgram = () => {
  const program = new Command();

  program
    .name('Hexabot')
    .description('A CLI to manage your Hexabot project instance')
    .version(getCliVersion());

  registerCheckCommand(program);
  registerCreateCommand(program);
  registerConfigCommand(program);
  registerDevCommand(program);
  registerDockerCommand(program);
  registerEnvCommand(program);
  registerStartCommand(program);
  registerMigrateCommand(program);

  return program;
};
