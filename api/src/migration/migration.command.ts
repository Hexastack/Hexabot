/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
      case 'create': {
        const [, version] = passedParam;

        if (!this.migrationService.isValidVersion(version)) {
          throw new TypeError('Invalid version value.');
        }

        return this.migrationService.create(version);
      }
      case 'migrate': {
        const [, action, version] = passedParam;

        if (
          !Object.values(MigrationAction).includes(action as MigrationAction)
        ) {
          this.logger.error('Invalid Operation');
          this.exit();
        }

        if (
          typeof version === 'undefined' ||
          this.migrationService.isValidVersion(version)
        ) {
          return await this.migrationService.run({
            action: action as MigrationAction,
            version,
          });
        } else {
          throw new TypeError('Invalid version value.');
        }
      }
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
