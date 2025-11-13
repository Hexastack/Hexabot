/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TestingModule } from '@nestjs/testing';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { modelFixtureIds, modelOrmFixtures } from '@hexabot/dev/fixtures/model';
import { installPermissionFixturesTypeOrm } from '@hexabot/dev/fixtures/permission';
import { closeTypeOrmConnections } from '@hexabot/dev/test';
import { buildTestingMocks } from '@hexabot/dev/utils';

import { Permission } from '../dto/permission.dto';
import { ModelOrmEntity as ModelEntity } from '../entities/model.entity';
import { PermissionOrmEntity } from '../entities/permission.entity';
import { RoleOrmEntity } from '../entities/role.entity';
import { UserOrmEntity } from '../entities/user.entity';
import { ModelRepository } from '../repositories/model.repository';
import { PermissionRepository } from '../repositories/permission.repository';

import { ModelService } from './model.service';

describe('ModelService (TypeORM)', () => {
  let module: TestingModule;
  let modelService: ModelService;
  let modelRepository: ModelRepository;
  let permissionRepository: PermissionRepository;
  let model: ModelEntity;
  let permissions: Permission[];

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [ModelService, PermissionRepository, ModelRepository],
      typeorm: {
        entities: [
          ModelEntity,
          PermissionOrmEntity,
          RoleOrmEntity,
          UserOrmEntity,
          AttachmentOrmEntity,
        ],
        fixtures: installPermissionFixturesTypeOrm,
      },
    });

    module = testing.module;

    [modelService, permissionRepository, modelRepository] =
      await testing.getMocks([
        ModelService,
        PermissionRepository,
        ModelRepository,
      ]);

    model = (await modelRepository.findOne(
      modelFixtureIds.contentType,
    )) as ModelEntity;
    permissions = await permissionRepository.find({
      where: { model: { id: modelFixtureIds.contentType } },
    });
  });

  afterEach(jest.clearAllMocks);

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('findOneAndPopulate', () => {
    it('should find a model and populate its permissions', async () => {
      const result = await modelService.findOneAndPopulate(model.id);
      const expectedFixture = modelOrmFixtures.find(
        ({ id }) => id === modelFixtureIds.contentType,
      )!;

      expect(result).toEqualPayload(
        {
          id: expectedFixture.id,
          name: expectedFixture.name,
          identity: expectedFixture.identity,
          relation: expectedFixture.relation,
        },
        ['permissions', 'attributes', 'createdAt', 'updatedAt'],
      );

      expect(
        (result?.permissions ?? []).map((permission) => permission.id).sort(),
      ).toEqual(permissions.map((permission) => permission.id).sort());
    });
  });

  describe('findAndPopulate', () => {
    it('should find models, and for each model populate the corresponding permissions', async () => {
      jest.spyOn(modelRepository, 'findAndPopulate');
      const models = await modelRepository.findAll();
      const allPermissions = await permissionRepository.findAll();
      const result = await modelService.findAndPopulate({});

      expect(modelRepository.findAndPopulate).toHaveBeenCalledWith({});

      expect(result).toHaveLength(models.length);

      result.forEach((modelResult) => {
        const expectedPermissions = allPermissions.filter(
          (permission) => permission.model === modelResult.id,
        );
        const permissionIds = (modelResult.permissions ?? [])
          .map((permission) => permission.id)
          .sort();
        expect(permissionIds).toEqual(
          expectedPermissions.map((permission) => permission.id).sort(),
        );
      });
    });
  });
});
