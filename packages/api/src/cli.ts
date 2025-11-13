/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import path from 'node:path';

import moduleAlias from 'module-alias';
import { CommandFactory } from 'nest-commander';

moduleAlias.addAliases({
  '@': __dirname,
  '@hexabot/attachment': path.join(__dirname, 'attachment'),
  '@hexabot/channel': path.join(__dirname, 'channel'),
  '@hexabot/chat': path.join(__dirname, 'chat'),
  '@hexabot/cms': path.join(__dirname, 'cms'),
  '@hexabot/extensions': path.join(__dirname, 'extensions'),
  '@hexabot/helper': path.join(__dirname, 'helper'),
  '@hexabot/i18n': path.join(__dirname, 'i18n'),
  '@hexabot/migration': path.join(__dirname, 'migration'),
  '@hexabot/nlp': path.join(__dirname, 'nlp'),
  '@hexabot/plugins': path.join(__dirname, 'plugins'),
  '@hexabot/user': path.join(__dirname, 'user'),
  '@hexabot/utils': path.join(__dirname, 'utils'),
});

import { HexabotModule } from './app.module';

async function bootstrap() {
  await CommandFactory.run(HexabotModule);
}

bootstrap();
