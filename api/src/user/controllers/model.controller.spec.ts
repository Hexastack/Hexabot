/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import {
  installModelFixtures,
  modelFixtures,
} from '@/utils/test/fixtures/model';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { ModelFull } from '../schemas/model.schema';
import { ModelService } from '../services/model.service';
import { PermissionService } from '../services/permission.service';

import { ModelController } from './model.controller';

describe('ModelController', () => {
  let modelController: ModelController;
  let modelService: ModelService;
  let permissionService: PermissionService;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      models: ['PermissionModel'],
      autoInjectFrom: ['controllers', 'providers'],
      controllers: [ModelController],
      imports: [rootMongooseTestModule(installModelFixtures)],
      providers: [PermissionService],
    });
    [modelController, modelService, permissionService] = await getMocks([
      ModelController,
      ModelService,
      PermissionService,
    ]);
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('find', () => {
    it('should find models', async () => {
      jest.spyOn(modelService, 'findAndPopulate');
      const result = await modelController.find(['permissions'], {});
      expect(modelService.findAndPopulate).toHaveBeenCalledWith({});
      expect(result).toEqualPayload(
        modelFixtures.map((modelFixture) => ({
          ...modelFixture,
          permissions: [],
        })),
      );
    });

    it('should find models, and for each model populate the corresponding permissions', async () => {
      jest.spyOn(modelService, 'findAndPopulate');
      const allModels = await modelService.findAll();
      const allPermissions = await permissionService.findAll();
      const result = await modelController.find(['permissions'], {});

      const modelsWithPermissionsAndUsers = allModels.reduce(
        (acc, currRole) => {
          const modelWithPermissionsAndUsers = {
            ...currRole,
            permissions: allPermissions.filter((currPermission) => {
              return currPermission.role === currRole.id;
            }),
          };

          acc.push(modelWithPermissionsAndUsers);
          return acc;
        },
        [] as ModelFull[],
      );

      expect(modelService.findAndPopulate).toHaveBeenCalledWith({});
      expect(result).toEqualPayload(modelsWithPermissionsAndUsers);
    });
  });
});
