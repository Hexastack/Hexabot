/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import fs from 'fs';
import { join } from 'path';

import { HttpService } from '@nestjs/axios';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { kebabCase } from 'lodash';
import mongoose, { Model } from 'mongoose';
import leanDefaults from 'mongoose-lean-defaults';
import leanGetters from 'mongoose-lean-getters';
import leanVirtuals from 'mongoose-lean-virtuals';

import { AttachmentService } from '@/attachment/services/attachment.service';
import { config } from '@/config';
import { LoggerService } from '@/logger/logger.service';
import { MetadataService } from '@/setting/services/metadata.service';
import idPlugin from '@/utils/schema-plugin/id.plugin';

import { Migration, MigrationDocument } from './migration.schema';
import {
  MigrationAction,
  MigrationName,
  MigrationRunOneParams,
  MigrationRunParams,
  MigrationSuccessCallback,
  MigrationVersion,
} from './types';

// Version starting which we added the migrations
const INITIAL_DB_VERSION = 'v2.1.9';

@Injectable()
export class MigrationService implements OnApplicationBootstrap {
  constructor(
    private moduleRef: ModuleRef,
    private readonly logger: LoggerService,
    private readonly metadataService: MetadataService,
    private readonly httpService: HttpService,
    private readonly attachmentService: AttachmentService,
    @InjectModel(Migration.name)
    private readonly migrationModel: Model<Migration>,
  ) {}

  async onApplicationBootstrap() {
    await this.ensureMigrationPathExists();

    if (mongoose.connection.readyState !== 1) {
      await this.connect();
    }
    this.logger.log('Mongoose connection established!');

    if (!this.isCLI && config.mongo.autoMigrate) {
      this.logger.log('Executing migrations ...');
      await this.run({
        action: MigrationAction.UP,
        isAutoMigrate: true,
      });
    }
  }

  public exit() {
    process.exit(0);
  }

  /**
   * Get The migrations dir path configured in migration.module.ts
   * @returns The migrations dir path
   */
  public get migrationFilePath() {
    return this.moduleRef.get('MONGO_MIGRATION_DIR');
  }

  /**
   * Checks if current running using CLI
   * @returns True if using CLI
   */
  public get isCLI() {
    return Boolean(process.env.HEXABOT_CLI);
  }

  /**
   * Checks if the migration version is in valid format
   * @param version migration version name
   * @returns True, if the migration version name is valid
   */
  public isValidVersion(version: string): version is MigrationVersion {
    const regex = /^v(\d+)\.(\d+)\.(\d+)$/;
    return regex.test(version);
  }

  /**
   * Checks if the migration path is well set and exists
   */
  private async ensureMigrationPathExists() {
    if (config.env !== 'test' && !fs.existsSync(this.migrationFilePath)) {
      await fs.promises.mkdir(this.migrationFilePath, {
        recursive: true,
      });
    }
  }

  /**
   * Creates a new migration file with the specified name.
   *
   * The file name is generated in kebab-case format, prefixed with a timestamp.
   * If a migration file with the same name already exists, an error is logged, and the process exits.
   *
   * @param version - The name of the migration to create.
   * @returns Resolves when the migration file is successfully created.
   *
   * @throws If there is an issue writing the migration file.
   */
  public create(version: MigrationVersion) {
    const name = kebabCase(version) as MigrationName;
    // check if file already exists
    const files = this.getMigrationFiles();
    const exist = files.some((file) => {
      const migrationName = this.getMigrationName(file);
      return migrationName === name;
    });

    if (exist) {
      this.logger.error(`Migration file for "${version}" already exists`);
      this.exit();
    }

    const migrationFileName = `${Date.now()}-${name}.migration.ts`;
    const filePath = join(this.migrationFilePath, migrationFileName);
    const template = this.getMigrationTemplate();
    try {
      fs.writeFileSync(filePath, template);
      this.logger.log(
        `Migration file for "${version}" created: ${migrationFileName}`,
      );
    } catch (e) {
      this.logger.error(e.stack);
    } finally {
      this.exit();
    }
  }

  /**
   * Get a migration template to be used while creating a new migration
   * @returns A migration template
   */
  private getMigrationTemplate() {
    return `import mongoose from 'mongoose';

import { MigrationServices } from '../types';

module.exports = {
  async up(services: MigrationServices) {
    // Migration logic
    return false;
  },
  async down(services: MigrationServices) {
    // Rollback logic
    return false;
  },
};`;
  }

  /**
   * Establishes a MongoDB connection
   */
  private async connect() {
    // Disable for unit tests
    if (config.env === 'test') {
      return;
    }

    try {
      const connection = await mongoose.connect(config.mongo.uri, {
        dbName: config.mongo.dbName,
      });

      connection.plugin(idPlugin);
      connection.plugin(leanVirtuals);
      connection.plugin(leanGetters);
      connection.plugin(leanDefaults);
    } catch (err) {
      this.logger.error('Failed to connect to MongoDB');
      throw err;
    }
  }

  /**
   * Executes migration operations based on the provided parameters.
   *
   * Determines the migration operation to perform (run all, run a specific migration, or run upgrades)
   * based on the input parameters. The process may exit after completing the operation.
   *
   * @param action - The migration action to perform (e.g., 'up' or 'down').
   * @param name - The specific migration name to execute. If not provided, all migrations are considered.
   * @param version - The target version for automatic migration upgrades.
   * @param isAutoMigrate - A flag indicating whether to perform automatic migration upgrades.
   *
   * @returns Resolves when the migration operation is successfully completed.
   */
  public async run({ action, version, isAutoMigrate }: MigrationRunParams) {
    if (!this.isCLI) {
      if (isAutoMigrate) {
        const metadata = await this.metadataService.findOne({
          name: 'db-version',
        });
        const version = metadata ? metadata.value : INITIAL_DB_VERSION;
        await this.runUpgrades(action, version);
      } else {
        // Do nothing ...
        return;
      }
    } else {
      if (!version) {
        await this.runAll(action);
      } else {
        await this.runOne({ action, version });
      }
      this.exit();
    }
  }

  /**
   * Executes a specific migration action for a given version.
   *
   * Verifies the migration status in the database before attempting to execute the action.
   * If the migration has already been executed, the process stops. Otherwise, it loads the
   * migration file, performs the action, and handles success or failure through callbacks.
   *
   * @param version - The version of the migration to run.
   * @param action - The action to perform (e.g., 'up' or 'down').
   *
   * @returns Resolves when the migration action is successfully executed or stops if the migration already exists.
   */
  private async runOne({ version, action }: MigrationRunOneParams) {
    // Verify DB status
    const { exist, migrationDocument } = await this.verifyStatus({
      version,
      action,
    });

    if (exist) {
      return false; // stop exec;
    }

    try {
      const migration = await this.loadMigrationFile(version);
      const result = await migration[action]({
        logger: this.logger,
        http: this.httpService,
        attachmentService: this.attachmentService,
      });

      if (result) {
        await this.successCallback({
          version,
          action,
          migrationDocument,
        });
      }

      return result; // stop exec;
    } catch (e) {
      this.failureCallback({
        version,
        action,
      });
      this.logger.log(e.stack);
      return false;
    }
  }

  /**
   * Compares two version strings to determine if the first version is newer than the second.
   *
   * @param version1 - The first version string (e.g., 'v1.2.3').
   * @param version2 - The second version string (e.g., 'v1.2.2').
   * @returns `true` if the first version is newer than the second, otherwise `false`.
   */
  private isNewerVersion(
    version1: MigrationVersion,
    version2: MigrationVersion,
  ): boolean {
    // Split both versions into their numeric components
    const v1Parts = version1.replace('v', '').split('.').map(Number);
    const v2Parts = version2.replace('v', '').split('.').map(Number);

    // Compare each part of the version number
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0; // Default to 0 if undefined
      const v2Part = v2Parts[i] || 0; // Default to 0 if undefined

      if (v1Part > v2Part) {
        return true;
      } else if (v1Part < v2Part) {
        return false;
      }
    }

    // If all parts are equal, the versions are the same
    return false;
  }

  /**
   * Executes migration upgrades for all available versions newer than the specified version.
   *
   * @param action - The migration action to perform (e.g., 'up').
   * @param version - The current version to compare against for upgrades.
   *
   * @returns The last successfully upgraded version.
   */
  private async runUpgrades(
    action: MigrationAction,
    version: MigrationVersion,
  ) {
    const versions = this.getAvailableUpgradeVersions();
    const filteredVersions = versions.filter((v) =>
      this.isNewerVersion(v, version),
    );

    if (!filteredVersions.length) {
      this.logger.log('No migrations to execute ...');
      return version;
    }

    let lastVersion = version;

    for (const version of filteredVersions) {
      await this.runOne({ version, action });
      lastVersion = version;
    }

    return lastVersion;
  }

  /**
   * Executes the specified migration action for all available versions.
   *
   * @param action - The migration action to perform (e.g., 'up' or 'down').
   *
   * @returns Resolves when all migration actions are successfully completed.
   */
  private async runAll(action: MigrationAction) {
    const versions = this.getAvailableUpgradeVersions();

    let lastVersion: MigrationVersion = INITIAL_DB_VERSION;
    for (const version of versions) {
      await this.runOne({ version, action });
      lastVersion = version;
    }

    return lastVersion;
  }

  /**
   * Verifies the migration status for a specific version and action.
   *
   * @param version - The version of the migration to verify.
   * @param action - The migration action to verify (e.g., 'up' or 'down').
   *
   * @returns A promise resolving to an object containing:
   * - `exist`: A boolean indicating if the migration already exists in the specified state.
   * - `migrationDocument`: The existing migration document, or `null` if not found.
   */
  private async verifyStatus({ version, action }: MigrationRunParams): Promise<{
    exist: boolean;
    migrationDocument: MigrationDocument | null;
  }> {
    let exist = false;
    const migrationDocument = await this.migrationModel.findOne({
      version,
    });

    if (migrationDocument) {
      exist = Boolean(migrationDocument.status === action);
      if (exist) {
        this.logger.warn(
          `Cannot proceed migration "${version}" is already in "${action}" state`,
        );
      }
    }

    return { exist, migrationDocument };
  }

  /**
   * Retrieves all migration files from the migration directory.
   *
   * Reads the files in the migration directory and filters for those matching
   * the `.migration.js` or `.migration.ts` file extensions.
   *
   * @returns A promise resolving to an array of migration file names.
   */
  getMigrationFiles() {
    const files = fs.readdirSync(this.migrationFilePath);
    return files.filter((file) => /\.migration\.(js|ts)$/.test(file));
  }

  /**
   * Extracts the migration name from a given filename.
   *
   * @param filename - The migration file name to process (e.g., '1234567890-my-migration.migration.ts').
   * @returns The extracted migration name (e.g., 'my-migration').
   */
  private getMigrationName(filename: string): MigrationName {
    const [, ...migrationNameParts] = filename.split('-');
    const migrationName = migrationNameParts.join('-');

    return migrationName.replace(/\.migration\.(js|ts)/, '') as MigrationName;
  }

  /**
   * Retrieves a list of available migration upgrade versions.
   *
   * Processes all migration files to extract and format their version identifiers.
   *
   * @returns An array of formatted migration versions (e.g., ['v1.0.0', 'v1.1.0']).
   */
  private getAvailableUpgradeVersions() {
    const filenames = this.getMigrationFiles();

    return filenames
      .map((filename) => this.getMigrationName(filename))
      .map((name) => {
        const [, ...migrationVersion] = name.split('-');
        return `v${migrationVersion.join('.')}` as MigrationVersion;
      })
      .filter((value, index, self) => self.indexOf(value) === index);
  }

  /**
   * Finds the migration file corresponding to a specific version.
   *
   * @param version - The migration version to search for (e.g., 'v1.0.0').
   * @returns The file name of the matching migration, or `null` if no match is found.
   */
  findMigrationFileByVersion(version: MigrationVersion): string | null {
    const files = this.getMigrationFiles();
    const migrationName = kebabCase(version) as MigrationName;
    return (
      files.find((file) => {
        const name = this.getMigrationName(file);
        return migrationName === name;
      }) || null
    );
  }

  /**
   * Loads a migration file for a specific version.
   *
   * @param version - The migration version to load.
   *
   * @returns The loaded migration object containing `up` and `down` methods.
   */
  private async loadMigrationFile(version: MigrationVersion) {
    try {
      // Map the provided name to the actual file with timestamp
      const fileName = this.findMigrationFileByVersion(version);
      if (!fileName) {
        this.logger.error(`Migration file for "${version}" not found.`);
        process.exit(1);
      }

      const filePath = join(this.migrationFilePath, fileName);
      const migration = await import(filePath);
      if (
        !migration ||
        typeof migration.up !== 'function' ||
        typeof migration.down !== 'function'
      ) {
        throw new Error(
          `Migration file "${version}" must export an object with "up" and "down" methods.`,
        );
      }
      return migration;
    } catch (e) {
      throw new Error(`Failed to load migration "${version}".\n${e.message}`);
    }
  }

  /**
   * Updates the status of a migration in the database.
   *
   * @param version - The version of the migration to update.
   * @param action - The action performed on the migration (e.g., 'up' or 'down').
   * @param migrationDocument - An optional existing migration document to update. If not provided, a new document is created.
   *
   * @returns Resolves when the migration status is successfully updated.
   */
  async updateStatus({
    version,
    action,
    migrationDocument,
  }: Omit<MigrationSuccessCallback, 'terminal'>) {
    const document =
      migrationDocument ||
      new this.migrationModel({
        version,
      });
    document.status = action;
    await document.save();
  }

  /**
   * Handles successful completion of a migration operation.
   *
   * @param version - The version of the successfully completed migration.
   * @param action - The action performed (e.g., 'up' or 'down').
   * @param migrationDocument - The migration document to update.
   *
   * @returns Resolves when all success-related operations are completed.
   */
  private async successCallback({
    version,
    action,
    migrationDocument,
  }: MigrationSuccessCallback): Promise<void> {
    await this.updateStatus({ version, action, migrationDocument });
    const migrationDisplayName = `${version} [${action}]`;
    this.logger.log(`"${migrationDisplayName}" migration done`);
    // Create or Update DB version
    await this.metadataService.updateOne(
      { name: 'db-version' },
      {
        value: version,
      },
      {
        // Create or update
        upsert: true,
        new: true,
      },
    );
    this.logger.log(`db-version metadata "${version}"`);
  }

  /**
   * Handles the failure of a migration operation.
   *
   * @param version - The version of the migration that failed.
   * @param action - The action that failed (e.g., 'up' or 'down').
   */
  private failureCallback({ version, action }: MigrationRunParams) {
    const migrationDisplayName = `${version} [${action}]`;
    this.logger.error(`"${migrationDisplayName}" migration failed`);
  }
}
