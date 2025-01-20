/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { HttpService } from '@nestjs/axios';

import { AttachmentService } from '@/attachment/services/attachment.service';
import { LoggerService } from '@/logger/logger.service';

import { MigrationDocument } from './migration.schema';

export enum MigrationAction {
  UP = 'up',
  DOWN = 'down',
}

export type MigrationVersion = `v${number}.${number}.${number}`;

export type MigrationName = `v-${number}-${number}-${number}`;

export interface MigrationRunParams {
  action: MigrationAction;
  version?: MigrationVersion;
  isAutoMigrate?: boolean;
}

export interface MigrationRunOneParams extends MigrationRunParams {
  version: MigrationVersion;
}

export interface MigrationSuccessCallback extends MigrationRunParams {
  migrationDocument: MigrationDocument | null;
}

export type MigrationServices = {
  logger: LoggerService;
  http: HttpService;
  attachmentService: AttachmentService;
};
