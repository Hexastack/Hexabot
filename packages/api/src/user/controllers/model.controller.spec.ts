/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TestingModule } from '@nestjs/testing';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { installPermissionFixturesTypeOrm } from '@/utils/test/fixtures/permission';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { ModelFull } from '../dto/model.dto';
import { ModelOrmEntity as ModelEntity } from '../entities/model.entity';
import { PermissionOrmEntity } from '../entities/permission.entity';
import { RoleOrmEntity } from '../entities/role.entity';
import { UserProfileOrmEntity } from '../entities/user-profile.entity';
import { UserOrmEntity } from '../entities/user.entity';
import { ModelRepository } from '../repositories/model.repository';
import { PermissionRepository } from '../repositories/permission.repository';
import { ModelService } from '../services/model.service';
import { PermissionService } from '../services/permission.service';

import { ModelController } from './model.controller';

describe('ModelController (TypeORM)', () => {
  let module: TestingModule;
  let modelController: ModelController;
  let modelService: ModelService;
  let permissionService: PermissionService;

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['controllers', 'providers'],
      controllers: [ModelController],
      providers: [
        ModelService,
        PermissionService,
        ModelRepository,
        PermissionRepository,
      ],
      typeorm: {
        entities: [
          UserProfileOrmEntity,
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

    [modelController, modelService, permissionService] = await testing.getMocks(
      [ModelController, ModelService, PermissionService],
    );
  });

  afterEach(jest.clearAllMocks);

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('find', () => {
    it('should find models', async () => {
      jest.spyOn(modelService, 'findAndPopulate');
      const result = (await modelController.find(
        ['permissions'],
        {},
      )) as ModelFull[];
      expect(modelService.findAndPopulate).toHaveBeenCalledWith({});
      expect(result.length).toBeGreaterThan(0);
      result.forEach((model) => {
        expect(model.permissions).toBeDefined();
      });
    });

    it('should populate permissions for each model', async () => {
      jest.spyOn(modelService, 'findAndPopulate');
      const allPermissions = await permissionService.findAll();
      const result = (await modelController.find(
        ['permissions'],
        {},
      )) as ModelFull[];

      expect(modelService.findAndPopulate).toHaveBeenCalledWith({});

      result.forEach((model) => {
        const expectedPermissionIds = allPermissions
          .filter((permission) => permission.model === model.id)
          .map((permission) => permission.id)
          .sort();
        const permissionIds = (model.permissions ?? [])
          .map((permission) => permission.id)
          .sort();

        expect(permissionIds).toEqual(expectedPermissionIds);
      });
    });
  });
});
