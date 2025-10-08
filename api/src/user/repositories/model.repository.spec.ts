/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { modelFixtures } from '@/utils/test/fixtures/model';
import { installPermissionFixtures } from '@/utils/test/fixtures/permission';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { ModelRepository } from '../repositories/model.repository';
import { PermissionRepository } from '../repositories/permission.repository';
import { ModelFull } from '../schemas/model.schema';
import { Permission } from '../schemas/permission.schema';

import { Model as ModelType } from './../schemas/model.schema';

describe('ModelRepository', () => {
  let modelRepository: ModelRepository;
  let permissionRepository: PermissionRepository;
  let modelModel: Model<ModelType>;
  let model: ModelType | null;
  let permissions: Permission[];

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      models: ['PermissionModel'],
      imports: [rootMongooseTestModule(installPermissionFixtures)],
      providers: [ModelRepository, PermissionRepository],
    });
    [permissionRepository, modelRepository, modelModel] = await getMocks([
      PermissionRepository,
      ModelRepository,
      getModelToken(Model.name),
    ]);
    model = await modelRepository.findOne({ name: 'ContentType' });
    permissions = await permissionRepository.find({ model: model!.id });
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('findOneAndPopulate', () => {
    it('should find a model and populate its permissions', async () => {
      jest.spyOn(modelModel, 'findById');
      const result = await modelRepository.findOneAndPopulate(model!.id);
      expect(modelModel.findById).toHaveBeenCalledWith(model!.id, undefined);
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
          permissions: allPermissions.filter(
            (permission) => permission.model === currModel.id,
          ),
        });
        return acc;
      }, [] as ModelFull[]);
      expect(modelModel.find).toHaveBeenCalledWith({}, undefined);
      expect(result).toEqualPayload(modelsWithPermissions);
    });
  });
});
