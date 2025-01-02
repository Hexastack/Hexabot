/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Command, CommandRunner } from 'nest-commander';

import { LoggerService } from '@/logger/logger.service';

import { MigrationService } from './migration.service';
import { MigrationAction } from './types';

@Command({
  name: 'migration',
  description: 'Manage Mongodb Migrations',
})
export class MigrationCommand extends CommandRunner {
  constructor(
    private readonly logger: LoggerService,
    private readonly migrationService: MigrationService,
  ) {
    super();
  }

  async run(passedParam: string[]): Promise<void> {
    const [subcommand] = passedParam;
    switch (subcommand) {
      case 'create':
        const [, filename] = passedParam;
        return await this.migrationService.create(filename);
      case 'migrate':
        const [, action, name] = passedParam;
        if (
          !Object.values(MigrationAction).includes(action as MigrationAction)
        ) {
          this.logger.error('Invalid Operation');
          this.exit();
        }
        return await this.migrationService.run({
          action: action as MigrationAction,
          name,
        });

      default:
        this.logger.error('No valid command provided');
        this.exit();
        break;
    }
  }

  exit(): void {
    this.logger.log('Exiting migration process.');
    process.exit(0);
  }
}
