/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { BlockOrmEntity } from '@/chat/entities/block.entity';
import { CategoryOrmEntity } from '@/chat/entities/category.entity';
import { ConversationOrmEntity } from '@/chat/entities/conversation.entity';
import { LabelGroupOrmEntity } from '@/chat/entities/label-group.entity';
import { LabelOrmEntity } from '@/chat/entities/label.entity';
import { SubscriberOrmEntity } from '@/chat/entities/subscriber.entity';
import { ModelOrmEntity } from '@/user/entities/model.entity';
import { PermissionOrmEntity } from '@/user/entities/permission.entity';
import { RoleOrmEntity } from '@/user/entities/role.entity';
import { UserOrmEntity } from '@/user/entities/user.entity';
import {
  installSubscriberFixturesTypeOrm,
  subscriberFixtures,
} from '@hexabot/dev/fixtures/subscriber';
import { closeTypeOrmConnections } from '@hexabot/dev/test';
import { buildTestingMocks } from '@hexabot/dev/utils';

import { SubscriberRepository } from './subscriber.repository';

describe('SubscriberRepository (TypeORM)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let subscriberRepository: SubscriberRepository;
  let repository: Repository<SubscriberOrmEntity>;
  let labelRepository: Repository<LabelOrmEntity>;
  let existingLabels: LabelOrmEntity[] = [];
  let existingUsers: UserOrmEntity[] = [];

  const createdSubscriberIds: string[] = [];
  const createdLabelIds: string[] = [];

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [SubscriberRepository],
      typeorm: {
        entities: [
          SubscriberOrmEntity,
          LabelOrmEntity,
          LabelGroupOrmEntity,
          BlockOrmEntity,
          CategoryOrmEntity,
          ConversationOrmEntity,
          AttachmentOrmEntity,
          UserOrmEntity,
          RoleOrmEntity,
          PermissionOrmEntity,
          ModelOrmEntity,
        ],
        fixtures: installSubscriberFixturesTypeOrm,
      },
    });

    module = testing.module;

    dataSource = module.get(DataSource);
    [subscriberRepository] = await testing.getMocks([SubscriberRepository]);
    repository = module.get<Repository<SubscriberOrmEntity>>(
      getRepositoryToken(SubscriberOrmEntity),
    );
    labelRepository = module.get<Repository<LabelOrmEntity>>(
      getRepositoryToken(LabelOrmEntity),
    );

    const fixtures = await installSubscriberFixturesTypeOrm(dataSource);
    existingLabels = fixtures.labels;
    existingUsers = fixtures.users;

    if (!existingLabels.length) {
      throw new Error('Expected label fixtures to be available');
    }
    if (!existingUsers.length) {
      throw new Error('Expected user fixtures to be available');
    }
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (createdSubscriberIds.length > 0) {
      await repository.delete(createdSubscriberIds);
      createdSubscriberIds.length = 0;
    }
    if (createdLabelIds.length > 0) {
      await labelRepository.delete(createdLabelIds);
      createdLabelIds.length = 0;
    }
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  const createPersistedSubscriber = async (
    overrides: Partial<SubscriberOrmEntity> = {},
  ): Promise<SubscriberOrmEntity> => {
    const subscriber = repository.create({
      first_name: `Test-${randomUUID().slice(0, 8)}`,
      last_name: 'User',
      foreign_id: `foreign-${randomUUID()}`,
      locale: 'en_EN',
      language: 'en',
      country: 'FR',
      timezone: 0,
      channel: { name: 'web-channel' },
      context: { vars: {} },
      lastvisit: new Date(),
      retainedFrom: new Date(),
      labels: existingLabels.slice(0, 2).map(
        ({ id }) =>
          ({
            id,
          }) as Pick<LabelOrmEntity, 'id'> & LabelOrmEntity,
      ),
      assignedTo: existingUsers[0]
        ? ({
            id: existingUsers[0].id,
          } as Pick<UserOrmEntity, 'id'> & UserOrmEntity)
        : null,
      ...overrides,
    });
    const saved = await repository.save(subscriber);
    createdSubscriberIds.push(saved.id);

    return saved;
  };
  const createPersistedLabel = async (): Promise<LabelOrmEntity> => {
    const unique = randomUUID();
    const label = labelRepository.create({
      title: `Generated Label ${unique}`,
      name: `generated_label_${unique}`,
      builtin: false,
      label_id: {
        messenger: `messenger_${unique}`,
        web: `web_${unique}`,
        twitter: `twitter_${unique}`,
        dimelo: `dimelo_${unique}`,
      },
      description: null,
    });
    const saved = await labelRepository.save(label);
    createdLabelIds.push(saved.id);

    return saved;
  };

  describe('findOneByForeignId', () => {
    it('returns the most recent subscriber matching a foreign id', async () => {
      const fixture = subscriberFixtures.find(
        ({ foreign_id }) => foreign_id === 'foreign-id-web-1',
      );
      if (!fixture?.foreign_id) {
        throw new Error('Expected fixture "foreign-id-web-1" to exist');
      }

      const subscriber = await subscriberRepository.findOneByForeignId(
        fixture.foreign_id,
      );

      expect(subscriber).not.toBeNull();
      expect(subscriber).toMatchObject({
        foreign_id: fixture.foreign_id,
        first_name: fixture.first_name,
        last_name: fixture.last_name,
        language: fixture.language,
      });
      expect(subscriber!.labels).toHaveLength(existingLabels.length);
      expect(subscriber!.assignedTo ?? null).toBe(existingUsers[0].id);
    });

    it('returns null when no subscriber matches the foreign id', async () => {
      const subscriber = await subscriberRepository.findOneByForeignId(
        `missing-${randomUUID()}`,
      );
      expect(subscriber).toBeNull();
    });
  });

  describe('findOneByForeignIdAndPopulate', () => {
    it('returns a populated subscriber matching the foreign id', async () => {
      const fixture = subscriberFixtures.find(
        ({ foreign_id }) => foreign_id === 'foreign-id-web-2',
      );
      if (!fixture?.foreign_id) {
        throw new Error('Expected fixture "foreign-id-web-2" to exist');
      }

      const subscriber =
        await subscriberRepository.findOneByForeignIdAndPopulate(
          fixture.foreign_id,
        );

      expect(subscriber).not.toBeNull();
      expect(subscriber!.foreign_id).toBe(fixture.foreign_id);
      expect(subscriber!.first_name).toBe(fixture.first_name);
      expect(subscriber!.labels.map((label) => label.id).sort()).toEqual(
        existingLabels.map((label) => label.id).sort(),
      );
      expect(subscriber!.assignedTo?.id ?? null).toBe(existingUsers[0].id);
      expect(subscriber!.avatar ?? null).toBeNull();
    });
  });

  describe('updateOneByForeignIdQuery', () => {
    it('updates a subscriber matching the provided foreign id', async () => {
      const entity = await createPersistedSubscriber({
        timezone: 2,
      });
      const updated = await subscriberRepository.updateOneByForeignIdQuery(
        entity.foreign_id ?? '',
        { timezone: 9 },
      );

      expect(updated.id).toBe(entity.id);
      expect(updated.timezone).toBe(9);

      const reloaded = await repository.findOne({
        where: { id: entity.id },
      });
      expect(reloaded?.timezone).toBe(9);
    });
  });

  describe('handBackByForeignIdQuery & handOverByForeignIdQuery', () => {
    it('unassigns then assigns a subscriber by foreign id', async () => {
      const entity = await createPersistedSubscriber();
      const assignedUser = existingUsers[0];
      const unassigned = await subscriberRepository.handBackByForeignIdQuery(
        entity.foreign_id ?? '',
      );
      expect(unassigned.assignedTo).toBeNull();

      const reassigned = await subscriberRepository.handOverByForeignIdQuery(
        entity.foreign_id ?? '',
        assignedUser.id,
      );

      expect(reassigned.assignedTo).toBe(assignedUser.id);

      const reloaded = await repository.findOne({
        where: { id: entity.id },
        relations: ['assignedTo'],
      });
      expect(reloaded?.assignedTo?.id ?? null).toBe(assignedUser.id);
    });
  });

  describe('updateLabels', () => {
    it('removes requested labels, adds new ones once, and returns updated ids', async () => {
      const initialLabelIds = existingLabels
        .slice(0, 2)
        .map((label) => label.id);
      const entity = await createPersistedSubscriber({
        labels: initialLabelIds.map(
          (id) =>
            ({
              id,
            }) as Pick<LabelOrmEntity, 'id'> & LabelOrmEntity,
        ),
      });
      const labelToRemove = initialLabelIds[0];
      const newLabel = await createPersistedLabel();
      const updated = await subscriberRepository.updateLabels(
        entity.id,
        [newLabel.id, newLabel.id],
        [labelToRemove],
      );

      expect(updated.labels).toContain(newLabel.id);
      expect(updated.labels).not.toContain(labelToRemove);
      expect(
        updated.labels.filter((labelId) => labelId === newLabel.id).length,
      ).toBe(1);

      const reloaded = await repository.findOne({
        where: { id: entity.id },
        relations: ['labels'],
      });
      expect(reloaded).not.toBeNull();

      const reloadedLabelIds = (reloaded?.labels ?? []).map(
        (label) => label.id,
      );
      expect(reloadedLabelIds).toContain(newLabel.id);
      expect(reloadedLabelIds).not.toContain(labelToRemove);
    });

    it('throws when the subscriber cannot be resolved', async () => {
      await expect(
        subscriberRepository.updateLabels(randomUUID(), [], []),
      ).rejects.toThrow(/Unable to resolve subscriber/);
    });
  });
});
