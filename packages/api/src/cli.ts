/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import 'dotenv/config';

import moduleAlias from 'module-alias';
import { CommandFactory } from 'nest-commander';

moduleAlias.addAliases({
  '@': __dirname,
});

import { HexabotModule } from './app.module';

const isCliContext =
  `${process.env.HEXABOT_CLI ?? ''}`.toLowerCase() === 'true' ||
  process.env.HEXABOT_CLI === '1';

async function bootstrap() {
  await CommandFactory.run(HexabotModule);
}

if (isCliContext) {
  bootstrap();
}
