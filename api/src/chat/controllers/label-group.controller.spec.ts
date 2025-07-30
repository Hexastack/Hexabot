/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';

import { NOT_FOUND_ID } from '@/utils/constants/mock';
import {
  installLabelGroupFixtures,
  labelGroupFixtures,
} from '@/utils/test/fixtures/label-group';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { LabelGroupCreateDto } from '../dto/label-group.dto';
import { LabelGroup } from '../schemas/label-group.schema';
import { LabelGroupService } from '../services/label-group.service';

import { LabelGroupController } from './label-group.controller';

describe('LabelGroupController', () => {
  let labelGroupController: LabelGroupController;
  let labelGroupService: LabelGroupService;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['controllers', 'providers'],
      controllers: [LabelGroupController],
      imports: [rootMongooseTestModule(installLabelGroupFixtures)],
      providers: [],
    });
    [labelGroupService, labelGroupController] = await getMocks([
      LabelGroupService,
      LabelGroupController,
    ]);
  });

  afterEach(jest.clearAllMocks);
  afterAll(closeInMongodConnection);

  describe('count', () => {
    it('should count label groups', async () => {
      jest.spyOn(labelGroupService, 'count');
      const result = await labelGroupController.filterCount();

      expect(labelGroupService.count).toHaveBeenCalled();
      expect(result).toEqual({ count: labelGroupFixtures.length });
    });
  });

  describe('findPage', () => {
    const pageQuery = getPageQuery<LabelGroup>();
    it('should find label groups', async () => {
      jest.spyOn(labelGroupService, 'find');
      const result = await labelGroupController.findPage(pageQuery, {});

      expect(labelGroupService.find).toHaveBeenCalledWith({}, pageQuery);
      expect(result).toEqualPayload(labelGroupFixtures);
    });
  });

  describe('findOne', () => {
    it('should find one label by id', async () => {
      const { name } = labelGroupFixtures[0];
      const label = (await labelGroupService.findOne({ name }))!;
      jest.spyOn(labelGroupService, 'findOne');
      const result = await labelGroupController.findOne(label.id);

      expect(labelGroupService.findOne).toHaveBeenCalledWith(label.id);
      expect(result).toEqualPayload(labelGroupFixtures[0]);
    });
  });

  describe('create', () => {
    it('should create a label group', async () => {
      jest.spyOn(labelGroupService, 'create');
      const labelGroupDto: LabelGroupCreateDto = {
        name: 'Sector',
      };
      const result = await labelGroupController.create(labelGroupDto);

      expect(labelGroupService.create).toHaveBeenCalledWith(labelGroupDto);
      expect(result).toEqualPayload(labelGroupDto);
    });
  });

  describe('deleteOne', () => {
    it('should delete one label by id', async () => {
      const labelGroupToDelete = await labelGroupService.create({
        name: 'To Be Deleted',
      });
      jest.spyOn(labelGroupService, 'deleteOne');
      const result = await labelGroupController.deleteOne(
        labelGroupToDelete.id,
      );

      expect(labelGroupService.deleteOne).toHaveBeenCalledWith(
        labelGroupToDelete.id,
      );
      expect(result).toEqual({
        acknowledged: true,
        deletedCount: 1,
      });
    });

    it('should throw a NotFoundException when attempting to delete a non existing label by id', async () => {
      await expect(
        labelGroupController.deleteOne(NOT_FOUND_ID),
      ).rejects.toThrow();
    });
  });

  describe('updateOne', () => {
    it('should update a label by id', async () => {
      const labelGroupToBeUpdated = await labelGroupService.create({
        name: 'To Be Updated',
      });
      jest.spyOn(labelGroupService, 'updateOne');
      const result = await labelGroupController.updateOne(
        labelGroupToBeUpdated.id,
        { name: 'Updated' },
      );
      expect(result).toEqualPayload({ name: 'Updated' });
    });

    it('should throw a NotFoundException when attempting to update a non existing label by id', async () => {
      await expect(
        labelGroupController.updateOne(NOT_FOUND_ID, { name: 'Foo Bar' }),
      ).rejects.toThrow();
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple labels', async () => {
      const labelGroups = (
        await labelGroupService.createMany([
          {
            name: 'Group 1',
          },
          {
            name: 'Group 2',
          },
        ])
      ).map(({ id }) => id);

      const result = await labelGroupController.deleteMany(labelGroups);

      expect(result.deletedCount).toEqual(labelGroups.length);
      const remainingValues = await labelGroupService.find({
        _id: { $in: labelGroups },
      });
      expect(remainingValues.length).toBe(0);
    });

    it('should throw BadRequestException when no IDs are provided', async () => {
      await expect(labelGroupController.deleteMany([])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when provided IDs do not exist', async () => {
      const nonExistentIds = [NOT_FOUND_ID, NOT_FOUND_ID.replace(/9/g, '8')];

      await expect(
        labelGroupController.deleteMany(nonExistentIds),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
