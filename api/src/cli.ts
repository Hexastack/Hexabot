/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import moduleAlias from 'module-alias';
import { CommandFactory } from 'nest-commander';

moduleAlias.addAliases({
  '@': __dirname,
});

import { HexabotModule } from './app.module';

async function bootstrap() {
  await CommandFactory.run(HexabotModule);
}

bootstrap();
