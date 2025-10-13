/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { repl } from '@nestjs/core';

import { HexabotModule } from './app.module';

async function bootstrap() {
  await repl(HexabotModule);
}
bootstrap();
