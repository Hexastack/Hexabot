/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';

import { modelFixtures } from '@/utils/test/fixtures/model';
import { installPermissionFixtures } from '@/utils/test/fixtures/permission';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { ModelRepository } from '../repositories/model.repository';
import { PermissionRepository } from '../repositories/permission.repository';
import { ModelModel } from '../schemas/model.schema';
import { Permission, PermissionModel } from '../schemas/permission.schema';

import { Model as ModelType } from './../schemas/model.schema';

describe('ModelRepository', () => {
  let modelRepository: ModelRepository;
  let permissionRepository: PermissionRepository;
  let modelModel: Model<ModelType>;
  let model: ModelType;
  let permissions: Permission[];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(installPermissionFixtures),
        MongooseModule.forFeature([ModelModel, PermissionModel]),
      ],
      providers: [ModelRepository, PermissionRepository, EventEmitter2],
    }).compile();
    permissionRepository =
      module.get<PermissionRepository>(PermissionRepository);
    modelRepository = module.get<ModelRepository>(ModelRepository);
    modelModel = module.get<Model<ModelType>>(getModelToken('Model'));
    model = await modelRepository.findOne({ name: 'ContentType' });
    permissions = await permissionRepository.find({ model: model.id });
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('findOneAndPopulate', () => {
    it('should find a model and populate its permissions', async () => {
      jest.spyOn(modelModel, 'findById');
      const result = await modelRepository.findOneAndPopulate(model.id);
      expect(modelModel.findById).toHaveBeenCalledWith(model.id);
      expect(result).toEqualPayload({
        ...modelFixtures.find(({ name }) => name === 'ContentType'),
        permissions,
      });
    });
  });

  describe('findAndPopulate', () => {
    it('should find models, and for each model populate the corresponding permissions', async () => {
      jest.spyOn(modelModel, 'find');
      const allModels = await modelRepository.findAll();
      const allPermissions = await permissionRepository.findAll();
      const result = await modelRepository.findAndPopulate({});
      const modelsWithPermissions = allModels.reduce((acc, currModel) => {
        acc.push({
          ...currModel,
          permissions: allPermissions.filter((permission) => {
            return permission.model === currModel.id;
          }),
        });
        return acc;
      }, []);
      expect(modelModel.find).toHaveBeenCalledWith({});
      expect(result).toEqualPayload(modelsWithPermissions);
    });
  });
});
