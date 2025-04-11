/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { MongooseModule } from '@nestjs/mongoose';

import { AttachmentRepository } from '@/attachment/repositories/attachment.repository';
import { AttachmentModel } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import {
  installModelFixtures,
  modelFixtures,
} from '@/utils/test/fixtures/model';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { InvitationRepository } from '../repositories/invitation.repository';
import { ModelRepository } from '../repositories/model.repository';
import { PermissionRepository } from '../repositories/permission.repository';
import { RoleRepository } from '../repositories/role.repository';
import { UserRepository } from '../repositories/user.repository';
import { InvitationModel } from '../schemas/invitation.schema';
import { ModelFull, ModelModel } from '../schemas/model.schema';
import { PermissionModel } from '../schemas/permission.schema';
import { RoleModel } from '../schemas/role.schema';
import { UserModel } from '../schemas/user.schema';
import { ModelService } from '../services/model.service';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';
import { UserService } from '../services/user.service';

import { ModelController } from './model.controller';

describe('ModelController', () => {
  let modelController: ModelController;
  let modelService: ModelService;
  let permissionService: PermissionService;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      controllers: [ModelController],
      imports: [
        rootMongooseTestModule(installModelFixtures),
        MongooseModule.forFeature([
          UserModel,
          RoleModel,
          PermissionModel,
          InvitationModel,
          ModelModel,
          AttachmentModel,
        ]),
      ],
      providers: [
        PermissionService,
        AttachmentService,
        AttachmentRepository,
        ModelService,
        ModelRepository,
        UserService,
        UserRepository,
        RoleService,
        RoleRepository,
        InvitationRepository,
        PermissionRepository,
        {
          provide: CACHE_MANAGER,
          useValue: {
            del: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
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
