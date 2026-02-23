#!/usr/bin/env node
/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { createCliProgram } from './cli.js';
import { checkPrerequisites } from './core/prerequisites.js';
import { printBanner } from './ui/banner.js';

const cliArgs = process.argv.slice(2);
const suppressIdleOutput =
  process.env.HEXABOT_CLI_DEV_IDLE === '1' && cliArgs.length === 0;

if (suppressIdleOutput) {
  process.exit(0);
}

printBanner();
checkPrerequisites({ silent: true });

const program = createCliProgram();

program.parse(process.argv);

if (!cliArgs.length) {
  program.outputHelp();
}
