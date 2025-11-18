/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Command } from 'commander';

import { registerComposeCommands } from './commands/compose.js';
import { registerCreateCommand } from './commands/create.js';
import { registerInitCommand } from './commands/init.js';
import { registerMigrateCommand } from './commands/migrate.js';
import { getCliVersion } from './utils/version.js';

export const createCliProgram = () => {
  const program = new Command();

  program
    .name('Hexabot')
    .description('A CLI to manage your Hexabot chatbot instance')
    .version(getCliVersion());

  registerCreateCommand(program);
  registerInitCommand(program);
  registerComposeCommands(program);
  registerMigrateCommand(program);

  return program;
};
