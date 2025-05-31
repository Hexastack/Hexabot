/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { NestFactory } from '@nestjs/core';
import moduleAlias from 'module-alias';

moduleAlias.addAliases({
  '@': __dirname,
});

import { HexabotModule } from './app.module';
import { LoggerService } from './logger/logger.service';
import { MigrationCommand } from './migration/migration.command';

const ALLOWED_COMMANDS = ['migration'];

async function bootstrap() {
  const [command, ...restArgs] = process.argv.slice(2);
  const appContext = await NestFactory.createApplicationContext(HexabotModule, {
    logger: false,
  });
  const logger = await appContext.resolve(LoggerService);

  if (!ALLOWED_COMMANDS.includes(command)) {
    logger.error(`unknown command '${command}'`);
    process.exit(1);
  } else if (command === 'migration') {
    const migrationCommand = appContext.get(MigrationCommand);
    await migrationCommand.run(restArgs);
  }
  await appContext.close();
}

bootstrap();
