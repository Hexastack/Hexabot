/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';

import { I18nService } from '@/i18n/services/i18n.service';
import { getUpdateOneError } from '@/utils/test/errors/messages';
import {
  contextVarFixtures,
  installContextVarFixtures,
} from '@/utils/test/fixtures/contextvar';
import { getPageQuery } from '@/utils/test/pagination';
import { sortRowsBy } from '@/utils/test/sort';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import {
  ContextVarCreateDto,
  ContextVarUpdateDto,
} from '../dto/context-var.dto';
import { ContextVar } from '../schemas/context-var.schema';
import { ContextVarService } from '../services/context-var.service';

import { ContextVarController } from './context-var.controller';

describe('ContextVarController', () => {
  let contextVarController: ContextVarController;
  let contextVarService: ContextVarService;
  let contextVar: ContextVar;
  let contextVarToDelete: ContextVar;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['controllers'],
      controllers: [ContextVarController],
      imports: [rootMongooseTestModule(installContextVarFixtures)],
      providers: [
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
          },
        },
      ],
    });
    [contextVarController, contextVarService] = await getMocks([
      ContextVarController,
      ContextVarService,
    ]);
    contextVar = (await contextVarService.findOne({
      label: 'test context var 1',
    }))!;
    contextVarToDelete = (await contextVarService.findOne({
      label: 'test context var 2',
    }))!;
  });

  afterEach(jest.clearAllMocks);

  afterAll(closeInMongodConnection);

  describe('count', () => {
    it('should count the contextVars', async () => {
      jest.spyOn(contextVarService, 'count');
      const result = await contextVarController.filterCount();

      expect(contextVarService.count).toHaveBeenCalled();
      expect(result).toEqual({ count: contextVarFixtures.length });
    });
  });

  describe('findPage', () => {
    it('should return an array of contextVars', async () => {
      const pageQuery = getPageQuery<ContextVar>();
      jest.spyOn(contextVarService, 'find');
      const result = await contextVarController.findPage(pageQuery, {});

      expect(contextVarService.find).toHaveBeenCalledWith({}, pageQuery);
      expect(result).toEqualPayload(contextVarFixtures.sort(sortRowsBy));
    });
  });

  describe('findOne', () => {
    it('should return the existing contextVar', async () => {
      jest.spyOn(contextVarService, 'findOne');
      const result = await contextVarController.findOne(contextVar.id);

      expect(contextVarService.findOne).toHaveBeenCalledWith(contextVar.id);
      expect(result).toEqualPayload(
        contextVarFixtures.find(({ label }) => label === contextVar.label)!,
      );
    });
  });

  describe('create', () => {
    it('should return created contextVar', async () => {
      jest.spyOn(contextVarService, 'create');
      const contextVarCreateDto: ContextVarCreateDto = {
        label: 'contextVarLabel2',
        name: 'test_add',
        permanent: false,
      };
      const result = await contextVarController.create(contextVarCreateDto);

      expect(contextVarService.create).toHaveBeenCalledWith(
        contextVarCreateDto,
      );
      expect(result).toEqualPayload(contextVarCreateDto);
    });
  });

  describe('deleteOne', () => {
    it('should delete a contextVar by id', async () => {
      jest.spyOn(contextVarService, 'deleteOne');
      const result = await contextVarController.deleteOne(
        contextVarToDelete.id,
      );

      expect(contextVarService.deleteOne).toHaveBeenCalledWith(
        contextVarToDelete.id,
      );
      expect(result).toEqual({
        acknowledged: true,
        deletedCount: 1,
      });
    });

    it('should throw a NotFoundException when attempting to delete a contextVar by id', async () => {
      await expect(
        contextVarController.deleteOne(contextVarToDelete.id),
      ).rejects.toThrow(
        new NotFoundException(
          `Context var with ID ${contextVarToDelete.id} not found.`,
        ),
      );
    });
  });

  describe('deleteMany', () => {
    const deleteResult = { acknowledged: true, deletedCount: 2 };

    it('should delete contextVars when valid IDs are provided', async () => {
      jest
        .spyOn(contextVarService, 'deleteMany')
        .mockResolvedValue(deleteResult);
      const result = await contextVarController.deleteMany([
        contextVarToDelete.id,
        contextVar.id,
      ]);

      expect(contextVarService.deleteMany).toHaveBeenCalledWith({
        _id: { $in: [contextVarToDelete.id, contextVar.id] },
      });
      expect(result).toEqual(deleteResult);
    });

    it('should throw BadRequestException when no IDs are provided', async () => {
      await expect(contextVarController.deleteMany([])).rejects.toThrow(
        new BadRequestException('No IDs provided for deletion.'),
      );
    });

    it('should throw NotFoundException when no contextVars are deleted', async () => {
      jest.spyOn(contextVarService, 'deleteMany').mockResolvedValue({
        acknowledged: true,
        deletedCount: 0,
      });

      await expect(
        contextVarController.deleteMany([contextVarToDelete.id, contextVar.id]),
      ).rejects.toThrow(
        new NotFoundException('Context vars with provided IDs not found'),
      );
    });
  });

  describe('updateOne', () => {
    const contextVarUpdatedDto: ContextVarUpdateDto = {
      name: 'updated_context_var_name',
    };
    it('should return updated contextVar', async () => {
      jest.spyOn(contextVarService, 'updateOne');
      const result = await contextVarController.updateOne(
        contextVar.id,
        contextVarUpdatedDto,
      );

      expect(contextVarService.updateOne).toHaveBeenCalledWith(
        contextVar.id,
        contextVarUpdatedDto,
      );
      expect(result).toEqualPayload({
        ...contextVarFixtures.find(({ label }) => label === contextVar.label),
        ...contextVarUpdatedDto,
      });
    });

    it('should throw a NotFoundException when attempting to update an non existing contextVar by id', async () => {
      await expect(
        contextVarController.updateOne(
          contextVarToDelete.id,
          contextVarUpdatedDto,
        ),
      ).rejects.toThrow(
        getUpdateOneError(ContextVar.name, contextVarToDelete.id),
      );
    });
  });
});
