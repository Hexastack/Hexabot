/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TestingModule } from '@nestjs/testing';

import { DummyOrmEntity } from '@/utils/test/dummy/entities/dummy.entity';
import { DummyService } from '@/utils/test/dummy/services/dummy.service';
import { installDummyFixturesTypeOrm } from '@/utils/test/fixtures/dummy';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { BaseOrmController } from './base-orm.controller';

describe('BaseOrmController', () => {
  let module: TestingModule;
  let controller: TestableBaseOrmController;
  let dummyService: DummyService;
  let totalDummies: number;

  class TestableBaseOrmController extends BaseOrmController<DummyOrmEntity> {
    constructor(public testService: DummyService) {
      super(testService);
    }
  }

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [DummyService],
      typeorm: {
        fixtures: installDummyFixturesTypeOrm,
      },
    });

    module = testing.module;
    [dummyService] = await testing.getMocks([DummyService]);

    totalDummies = await dummyService.count();
    controller = new TestableBaseOrmController(dummyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('count', () => {
    it('should count all records', async () => {
      const countSpy = jest.spyOn(dummyService, 'count');
      const result = await controller.count({});

      expect(countSpy).toHaveBeenCalledWith({});
      expect(result).toEqual({ count: totalDummies });
    });

    it('should count records with filter options', async () => {
      const countSpy = jest.spyOn(dummyService, 'count');
      const options = { where: { dummy: 'dummy test 1' } };
      const result = await controller.count(options);

      expect(countSpy).toHaveBeenCalledWith(options);
      expect(result).toEqual({ count: 1 });
    });
  });
});
