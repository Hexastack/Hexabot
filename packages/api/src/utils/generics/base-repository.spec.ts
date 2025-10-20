/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import { TestingModule } from '@nestjs/testing';
import { In, Repository } from 'typeorm';

import { DummyOrmEntity } from '@/utils/test/dummy/entities/dummy.entity';
import { DummyRepository } from '@/utils/test/dummy/repositories/dummy.repository';
import {
  dummyFixtures,
  installDummyFixturesTypeOrm,
} from '@/utils/test/fixtures/dummy';
import {
  closeTypeOrmConnections,
  getLastTypeOrmDataSource,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

describe('BaseOrmRepository', () => {
  let dummyRepository: DummyRepository;
  let module: TestingModule;
  let ormRepository: Repository<DummyOrmEntity>;
  let baselineEntities: DummyOrmEntity[];

  beforeAll(async () => {
    const { module: testingModule, getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [DummyRepository],
      typeorm: {
        entities: [DummyOrmEntity],
        fixtures: installDummyFixturesTypeOrm,
      },
    });

    module = testingModule;
    [dummyRepository] = await getMocks([DummyRepository]);

    const dataSource = getLastTypeOrmDataSource();
    ormRepository = dataSource.getRepository(DummyOrmEntity);
  });

  beforeEach(async () => {
    await ormRepository.clear();
    baselineEntities = await ormRepository.save(
      ormRepository.create(dummyFixtures),
    );
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('find operations', () => {
    it('should return all dummy entities', async () => {
      const results = await dummyRepository.findAll();

      expect(results).toHaveLength(dummyFixtures.length);
      const names = results.map((entity) => entity.dummy).sort();
      expect(names).toEqual(
        dummyFixtures.map((fixture) => fixture.dummy).sort(),
      );
    });

    it('should return all dummy entities when populating', async () => {
      const results = await dummyRepository.findAllAndPopulate();

      expect(results).toHaveLength(dummyFixtures.length);
    });

    it('should find one entity by id', async () => {
      const target = baselineEntities[0];
      const result = await dummyRepository.findOne(target.id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(target.id);
      expect(result!.dummy).toBe(target.dummy);
    });

    it('should find one entity by options', async () => {
      const target = baselineEntities[1];
      const options = { where: { id: target.id } };
      const result = await dummyRepository.findOne(options);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(target.id);
    });

    it('should count matching entities', async () => {
      const total = await dummyRepository.count();
      expect(total).toBe(dummyFixtures.length);

      const count = await dummyRepository.count({
        where: { dummy: baselineEntities[0].dummy },
      });
      expect(count).toBe(1);
    });
  });

  describe('create operations', () => {
    it('should create one entity', async () => {
      const payload = { dummy: 'dummy test 5' };
      const result = await dummyRepository.create(payload);

      expect(result.dummy).toBe(payload.dummy);
      const stored = await ormRepository.findOne({ where: { id: result.id } });
      expect(stored).not.toBeNull();
      expect(stored!.dummy).toBe(payload.dummy);
    });

    it('should create many entities', async () => {
      const payloads = [
        { dummy: 'bulk 1' },
        { dummy: 'bulk 2', dynamicField: { foo: 'bar' } },
      ];
      const results = await dummyRepository.createMany(payloads);

      expect(results).toHaveLength(payloads.length);
      const stored = await ormRepository.find({
        where: { dummy: In(payloads.map((payload) => payload.dummy)) },
      });
      expect(stored).toHaveLength(payloads.length);
    });
  });

  describe('update operations', () => {
    it('should update an entity by id', async () => {
      const target = baselineEntities[0];
      const payload = { dummy: 'updated dummy text' };
      const result = await dummyRepository.update(target.id, payload);

      expect(result).not.toBeNull();
      expect(result!.dummy).toBe(payload.dummy);
      const stored = await ormRepository.findOne({ where: { id: target.id } });
      expect(stored!.dummy).toBe(payload.dummy);
    });

    it('should update one entity matching options', async () => {
      const target = baselineEntities[1];
      const payload = { dummy: 'updated from options' };
      const options = { where: { id: target.id } };
      const result = await dummyRepository.updateOne(options, payload);

      expect(result.dummy).toBe(payload.dummy);
      const stored = await ormRepository.findOne({ where: { id: target.id } });
      expect(stored!.dummy).toBe(payload.dummy);
    });

    it('should upsert when updateOne cannot find a match and upsert is enabled', async () => {
      const payload = { dummy: 'upserted dummy' };
      const options = { where: { id: randomUUID() } };
      const result = await dummyRepository.updateOne(options, payload, {
        upsert: true,
      });

      expect(result.dummy).toBe(payload.dummy);
      const stored = await ormRepository.findOne({ where: { id: result.id } });
      expect(stored!.dummy).toBe(payload.dummy);
    });

    it('should update many entities', async () => {
      const payload = { dummy: 'bulk updated' };
      const results = await dummyRepository.updateMany({}, payload);

      expect(results).toHaveLength(dummyFixtures.length);
      const stored = await ormRepository.find();
      stored.forEach((entity) => expect(entity.dummy).toBe(payload.dummy));
    });
  });

  describe('findOrCreate operations', () => {
    it('should return existing entity when found', async () => {
      const target = baselineEntities[0];
      const result = await dummyRepository.findOneOrCreate(target.id, {
        dummy: 'should not override',
      });

      expect(result.id).toBe(target.id);
      expect(result.dummy).toBe(target.dummy);
    });

    it('should create a new entity when none match', async () => {
      const payload = { dummy: 'new dummy' };
      const result = await dummyRepository.findOneOrCreate(
        { where: { dummy: 'non-existing' } },
        payload,
      );

      expect(result.dummy).toBe(payload.dummy);
      const stored = await ormRepository.findOne({ where: { id: result.id } });
      expect(stored!.dummy).toBe(payload.dummy);
    });
  });

  describe('delete operations', () => {
    it('should delete one entity by id', async () => {
      const target = baselineEntities[0];
      const result = await dummyRepository.deleteOne(target.id);

      expect(result).toEqualPayload({ acknowledged: true, deletedCount: 1 });
      const stored = await ormRepository.findOne({ where: { id: target.id } });
      expect(stored).toBeNull();
    });

    it('should delete one entity by options', async () => {
      const target = baselineEntities[1];
      const options = { where: { id: target.id } };
      const result = await dummyRepository.deleteOne(options);

      expect(result).toEqualPayload({ acknowledged: true, deletedCount: 1 });
      const stored = await ormRepository.findOne({ where: { id: target.id } });
      expect(stored).toBeNull();
    });

    it('should delete many entities', async () => {
      const targetIds = baselineEntities.slice(0, 2).map((entity) => entity.id);
      const result = await dummyRepository.deleteMany({
        where: { id: In(targetIds) },
      });

      expect(result).toEqualPayload({ acknowledged: true, deletedCount: 2 });
      const remaining = await ormRepository.find();
      expect(remaining).toHaveLength(dummyFixtures.length - 2);
    });
  });
});
