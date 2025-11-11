/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TestingModule } from '@nestjs/testing';

import {
  installMenuFixturesTypeOrm,
  rootMenuFixtures,
} from '@/utils/test/fixtures/menu';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { MenuOrmEntity, MenuType } from '../entities/menu.entity';

import { MenuRepository } from './menu.repository';

describe('MenuRepository (TypeORM)', () => {
  let module: TestingModule;
  let repository: MenuRepository;
  const createdMenuIds = new Set<string>();

  beforeAll(async () => {
    const { module: testingModule, getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [MenuRepository],
      typeorm: {
        entities: [MenuOrmEntity],
        fixtures: installMenuFixturesTypeOrm,
      },
    });
    module = testingModule;
    [repository] = await getMocks([MenuRepository]);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    for (const id of Array.from(createdMenuIds)) {
      await repository.deleteOne(id);
      createdMenuIds.delete(id);
    }
  });

  describe('preCreate validation', () => {
    it('allows nested menu without payload', async () => {
      const created = await repository.create({
        title: 'Nested allowed',
        type: MenuType.nested,
      });
      createdMenuIds.add(created.id);

      expect(created).toMatchObject({
        title: 'Nested allowed',
        type: MenuType.nested,
      });
    });

    it('requires payload for postback menu', async () => {
      await expect(
        repository.create({
          title: 'Missing payload',
          type: MenuType.postback,
        }),
      ).rejects.toThrow();
    });

    it('requires url for web_url menu', async () => {
      await expect(
        repository.create({
          title: 'Missing url',
          type: MenuType.web_url,
        }),
      ).rejects.toThrow();
    });
  });

  describe('preUpdate validation', () => {
    it('prevents updating menu type after creation', async () => {
      const created = await repository.create({
        title: `${rootMenuFixtures[0].title}-type-lock`,
        type: MenuType.nested,
      });
      createdMenuIds.add(created.id);

      await expect(
        repository.updateOne(created.id, { type: MenuType.postback }),
      ).rejects.toThrow();
    });

    it('validates payload when updating postback menu', async () => {
      const created = await repository.create({
        title: 'Postback menu',
        type: MenuType.postback,
        payload: 'initial',
      });
      createdMenuIds.add(created.id);

      const updated = await repository.updateOne(created.id, {
        payload: 'updatedPayload',
      });

      expect(updated).not.toBeNull();
      if (!updated) {
        throw new Error('Expected menu update to succeed');
      }
      expect(updated.payload).toBe('updatedPayload');
    });
  });
});
