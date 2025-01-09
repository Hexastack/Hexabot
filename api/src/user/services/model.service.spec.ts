/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { modelFixtures } from '@/utils/test/fixtures/model';
import { installPermissionFixtures } from '@/utils/test/fixtures/permission';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { ModelRepository } from '../repositories/model.repository';
import { PermissionRepository } from '../repositories/permission.repository';
import { Model, ModelFull, ModelModel } from '../schemas/model.schema';
import { Permission, PermissionModel } from '../schemas/permission.schema';

import { ModelService } from './model.service';

describe('ModelService', () => {
  let modelService: ModelService;
  let modelRepository: ModelRepository;
  let permissionRepository: PermissionRepository;
  let model: Model | null;
  let permissions: Permission[];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(installPermissionFixtures),
        MongooseModule.forFeature([ModelModel, PermissionModel]),
      ],
      providers: [
        ModelService,
        ModelRepository,
        PermissionRepository,
        EventEmitter2,
      ],
    }).compile();
    modelService = module.get<ModelService>(ModelService);
    permissionRepository =
      module.get<PermissionRepository>(PermissionRepository);
    modelRepository = module.get<ModelRepository>(ModelRepository);
    model = await modelRepository.findOne({ name: 'ContentType' });
    permissions = await permissionRepository.find({ model: model!.id });
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('findOneAndPopulate', () => {
    it('should find a model and populate its permissions', async () => {
      const result = await modelService.findOneAndPopulate(model!.id);
      expect(result).toEqualPayload({
        ...modelFixtures.find(({ name }) => name === 'ContentType'),
        permissions,
      });
    });
  });
  describe('findAndPopulate', () => {
    it('should find models, and for each model populate the corresponding permissions', async () => {
      jest.spyOn(modelRepository, 'findAndPopulate');
      const models = await modelRepository.findAll();
      const permissions = await permissionRepository.findAll();
      const result = await modelService.findAndPopulate({});
      const modelsWithPermissions = models.reduce((acc, currModel) => {
        acc.push({
          ...currModel,
          permissions: permissions.filter(
            (permission) => permission.model === currModel.id,
          ),
        });
        return acc;
      }, [] as ModelFull[]);
      expect(modelRepository.findAndPopulate).toHaveBeenCalledWith(
        {},
        undefined,
        undefined,
      );
      expect(result).toEqualPayload(modelsWithPermissions);
    });
  });
});
