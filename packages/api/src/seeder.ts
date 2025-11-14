/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { LoggerService } from '@hexabot/logger';
import { MetadataSeeder } from '@hexabot/setting/seeds/metadata.seed';
import { DEFAULT_METADATA } from '@hexabot/setting/seeds/metadata.seed-model';
import { SettingSeeder } from '@hexabot/setting/seeds/setting.seed';
import { DEFAULT_SETTINGS } from '@hexabot/setting/seeds/setting.seed-model';
import { INestApplicationContext } from '@nestjs/common';

import { CategorySeeder } from './chat/seeds/category.seed';
import { categoryModels } from './chat/seeds/category.seed-model';
import { ContextVarSeeder } from './chat/seeds/context-var.seed';
import { contextVarModels } from './chat/seeds/context-var.seed-model';
import { LanguageSeeder } from './i18n/seeds/language.seed';
import { languageModels } from './i18n/seeds/language.seed-model';
import { TranslationSeeder } from './i18n/seeds/translation.seed';
import { translationModels } from './i18n/seeds/translation.seed-model';
import { NlpEntitySeeder } from './nlp/seeds/nlp-entity.seed';
import { nlpEntityModels } from './nlp/seeds/nlp-entity.seed-model';
import { NlpValueSeeder } from './nlp/seeds/nlp-value.seed';
import { nlpValueModels } from './nlp/seeds/nlp-value.seed-model';
import { PermissionCreateDto } from './user/dto/permission.dto';
import { Role } from './user/dto/role.dto';
import { ModelSeeder } from './user/seeds/model.seed';
import { modelModels } from './user/seeds/model.seed-model';
import { PermissionSeeder } from './user/seeds/permission.seed';
import { permissionModels } from './user/seeds/permission.seed-model';
import { RoleSeeder } from './user/seeds/role.seed';
import { roleModels } from './user/seeds/role.seed-model';
import { UserSeeder } from './user/seeds/user.seed';
import { userModels } from './user/seeds/user.seed-model';

export async function seedDatabase(app: INestApplicationContext) {
  const logger = await app.resolve(LoggerService);
  const modelSeeder = app.get(ModelSeeder);
  const categorySeeder = app.get(CategorySeeder);
  const contextVarSeeder = app.get(ContextVarSeeder);
  const roleSeeder = app.get(RoleSeeder);
  const settingSeeder = app.get(SettingSeeder);
  const metadataSeeder = app.get(MetadataSeeder);
  const permissionSeeder = app.get(PermissionSeeder);
  const userSeeder = app.get(UserSeeder);
  const languageSeeder = app.get(LanguageSeeder);
  const translationSeeder = app.get(TranslationSeeder);
  const nlpEntitySeeder = app.get(NlpEntitySeeder);
  const nlpValueSeeder = app.get(NlpValueSeeder);
  const existingUsers = await userSeeder.findAll();

  if (existingUsers.length > 0) {
    logger.log('Database already seeded, aborting ...');

    return;
  }

  // Seed models
  try {
    await modelSeeder.seed(modelModels);
  } catch (e) {
    logger.error('Unable to seed the database with models!');
    throw e;
  }

  // Seed roles
  try {
    await roleSeeder.seed(roleModels);
  } catch (e) {
    logger.error('Unable to seed the database with roles!');
    throw e;
  }

  const models = await modelSeeder.findAll();
  const roles = await roleSeeder.findAll();
  const adminRole = roles.find(({ name }) => name === 'admin') as Role;
  const managerRole = roles.find(({ name }) => name === 'manager') as Role;
  const managerModels = models.filter(
    (model) => !['Role', 'User', 'Permission'].includes(model.name),
  );
  const roleModelsCombinations = [
    ...models.map((model) => [model.id, adminRole.id]),
    ...managerModels.map((model) => [model.id, managerRole.id]),
  ] as [string, string][];
  const permissionSeeds = roleModelsCombinations.reduce(
    (acc, [modelId, roleId]) => {
      return acc.concat(permissionModels(modelId, roleId));
    },
    [] as PermissionCreateDto[],
  );

  // Seed permissions
  try {
    await permissionSeeder.seed(permissionSeeds);
  } catch (e) {
    logger.error('Unable to seed the database with permissions!');
    throw e;
  }

  if (adminRole) {
    // Seed users
    try {
      await userSeeder.seed(userModels([adminRole.id]));
    } catch (e) {
      logger.error('Unable to seed the database with users!');
      throw e;
    }
  }

  // Seed settings and metadata
  try {
    await settingSeeder.seed(DEFAULT_SETTINGS);
    await metadataSeeder.seed(DEFAULT_METADATA);
  } catch (e) {
    logger.error('Unable to seed the database with settings and metadata!');
    throw e;
  }

  // Seed categories
  try {
    await categorySeeder.seed(categoryModels);
  } catch (e) {
    logger.error('Unable to seed the database with categories!');
    throw e;
  }

  // Seed context vars
  try {
    await contextVarSeeder.seed(contextVarModels);
  } catch (e) {
    logger.error('Unable to seed the database with context vars!');
    throw e;
  }

  // Seed languages
  try {
    await languageSeeder.seed(languageModels);
  } catch (e) {
    logger.error('Unable to seed the database with languages!');
    throw e;
  }

  // Seed translations
  try {
    await translationSeeder.seed(translationModels);
  } catch (e) {
    logger.error('Unable to seed the database with translations!');
    throw e;
  }

  // Seed Nlp entities and values
  try {
    await nlpEntitySeeder.seed(nlpEntityModels);
    await nlpValueSeeder.seed(nlpValueModels);
  } catch (e) {
    logger.error('Unable to seed the database with nlp entities!');
    throw e;
  }
}
