/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
