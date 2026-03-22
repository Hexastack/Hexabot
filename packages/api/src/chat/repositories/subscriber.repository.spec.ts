/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { LabelOrmEntity } from '@/chat/entities/label.entity';
import { SubscriberOrmEntity } from '@/chat/entities/subscriber.entity';
import { UserOrmEntity } from '@/user/entities/user.entity';
import {
  installSubscriberFixturesTypeOrm,
  subscriberFixtures,
} from '@/utils/test/fixtures/subscriber';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { SubscriberRepository } from './subscriber.repository';

describe('SubscriberRepository (TypeORM)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let subscriberRepository: SubscriberRepository;
  let repository: Repository<SubscriberOrmEntity>;
  let labelRepository: Repository<LabelOrmEntity>;
  let userRepository: Repository<UserOrmEntity>;
  let existingLabels: LabelOrmEntity[] = [];
  let existingUsers: UserOrmEntity[] = [];

  const createdSubscriberIds: string[] = [];
  const createdLabelIds: string[] = [];
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [SubscriberRepository],
      typeorm: {
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
    userRepository = module.get<Repository<UserOrmEntity>>(
      getRepositoryToken(UserOrmEntity),
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
    if (createdUserIds.length > 0) {
      await userRepository.delete(createdUserIds);
      createdUserIds.length = 0;
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
      firstName: `Test-${randomUUID().slice(0, 8)}`,
      lastName: 'User',
      foreignId: `foreign-${randomUUID()}`,
      locale: 'en_EN',
      language: 'en',
      country: 'FR',
      timezone: 0,
      channel: { name: 'web-channel' },
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
  const createPersistedUser = async (
    overrides: Partial<UserOrmEntity> = {},
  ): Promise<UserOrmEntity> => {
    const unique = randomUUID();
    const user = userRepository.create({
      firstName: 'Support',
      lastName: `Agent-${unique.slice(0, 6)}`,
      username: `agent_${unique.slice(0, 8)}`,
      email: `agent_${unique.slice(0, 8)}@example.com`,
      password: '$2b$10$2tdM5v5Ku8h7xBo5CJQnEukT4V8wfJf7pKQ4R0fFh9htY8e7X0ByW',
      state: true,
      sendEmail: false,
      resetCount: 0,
      resetToken: null,
      language: 'en',
      timezone: 0,
      channel: { name: 'web-channel' },
      foreignId: `foreign-user-${unique}`,
      roles: (existingUsers[0]?.roles ?? []).map(
        ({ id }) =>
          ({
            id,
          }) as UserOrmEntity['roles'][number],
      ),
      ...overrides,
    });
    const saved = await userRepository.save(user);
    createdUserIds.push(saved.id);

    return saved;
  };

  describe('findOneByForeignId', () => {
    it('returns the most recent subscriber matching a foreign id', async () => {
      const fixture = subscriberFixtures.find(
        ({ foreignId }) => foreignId === 'foreign-id-web-1',
      );
      if (!fixture?.foreignId) {
        throw new Error('Expected fixture "foreign-id-web-1" to exist');
      }

      const subscriber = await subscriberRepository.findOneByForeignId(
        fixture.foreignId,
      );

      expect(subscriber).not.toBeNull();
      expect(subscriber).toMatchObject({
        foreignId: fixture.foreignId,
        firstName: fixture.firstName,
        lastName: fixture.lastName,
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
        ({ foreignId }) => foreignId === 'foreign-id-web-2',
      );
      if (!fixture?.foreignId) {
        throw new Error('Expected fixture "foreign-id-web-2" to exist');
      }

      const subscriber =
        await subscriberRepository.findOneByForeignIdAndPopulate(
          fixture.foreignId,
        );

      expect(subscriber).not.toBeNull();
      expect(subscriber!.foreignId).toBe(fixture.foreignId);
      expect(subscriber!.firstName).toBe(fixture.firstName);
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
        entity.foreignId ?? '',
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
        entity.foreignId ?? '',
      );
      expect(unassigned.assignedTo).toBeNull();

      const reassigned = await subscriberRepository.handOverByForeignIdQuery(
        entity.foreignId ?? '',
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

  describe('assignment helpers', () => {
    it('counts assigned subscribers by user id', async () => {
      const missingUserId = randomUUID();
      const counts =
        await subscriberRepository.countAssignedSubscribersByUserIds([
          existingUsers[0].id,
          missingUserId,
        ]);

      expect(counts[existingUsers[0].id]).toBeGreaterThan(0);
      expect(counts[missingUserId] ?? 0).toBe(0);
    });
  });

  describe('assignment lifecycle hooks', () => {
    it('updates assignedAt and emits assign hook on reassignment', async () => {
      const assigneeA = existingUsers[0];
      const assigneeB = await createPersistedUser();
      const initialAssignedAt = new Date('2024-01-01T00:00:00.000Z');
      const entity = await createPersistedSubscriber({
        assignedAt: initialAssignedAt,
        assignedTo: { id: assigneeA.id } as Pick<UserOrmEntity, 'id'> &
          UserOrmEntity,
      });
      const emitSpy = jest.spyOn(
        subscriberRepository.getEventEmitter(),
        'emit',
      );
      const updated = await subscriberRepository.updateOne(entity.id, {
        assignedTo: assigneeB.id,
      });

      expect(updated.assignedTo).toBe(assigneeB.id);
      expect(updated.assignedAt).toBeInstanceOf(Date);
      expect(updated.assignedAt).not.toEqual(initialAssignedAt);
      expect(emitSpy).toHaveBeenCalledWith(
        'hook:subscriber:assign',
        expect.objectContaining({
          assignedTo: assigneeB.id,
          assignedAt: expect.any(Date),
        }),
        expect.objectContaining({
          id: entity.id,
        }),
      );
    });

    it('clears assignedAt and emits assign hook on handback', async () => {
      const assignee = existingUsers[0];
      const entity = await createPersistedSubscriber({
        assignedAt: new Date('2024-01-01T00:00:00.000Z'),
        assignedTo: { id: assignee.id } as Pick<UserOrmEntity, 'id'> &
          UserOrmEntity,
      });
      const emitSpy = jest.spyOn(
        subscriberRepository.getEventEmitter(),
        'emit',
      );
      const updated = await subscriberRepository.handBackByForeignIdQuery(
        entity.foreignId ?? '',
      );

      expect(updated.assignedTo).toBeNull();
      expect(updated.assignedAt).toBeNull();
      expect(emitSpy).toHaveBeenCalledWith(
        'hook:subscriber:assign',
        expect.objectContaining({
          assignedTo: null,
          assignedAt: null,
        }),
        expect.objectContaining({
          id: entity.id,
        }),
      );
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
