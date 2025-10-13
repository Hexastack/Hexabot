/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { modelFixtures } from '@/utils/test/fixtures/model';
import { installPermissionFixtures } from '@/utils/test/fixtures/permission';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { ModelRepository } from '../repositories/model.repository';
import { PermissionRepository } from '../repositories/permission.repository';
import { Model, ModelFull } from '../schemas/model.schema';
import { Permission } from '../schemas/permission.schema';

import { ModelService } from './model.service';

describe('ModelService', () => {
  let modelService: ModelService;
  let modelRepository: ModelRepository;
  let permissionRepository: PermissionRepository;
  let model: Model | null;
  let permissions: Permission[];

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      models: ['PermissionModel'],
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installPermissionFixtures)],
      providers: [ModelService, PermissionRepository],
    });
    [modelService, permissionRepository, modelRepository] = await getMocks([
      ModelService,
      PermissionRepository,
      ModelRepository,
    ]);
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
