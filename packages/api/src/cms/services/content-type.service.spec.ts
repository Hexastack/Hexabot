/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ContentTypeCreateDto } from '../dto/contentType.dto';
import { ContentType } from '../entities/content-type.entity';
import { ContentTypeRepository } from '../repositories/content-type.repository';
import { ContentTypeService } from './content-type.service';

describe('ContentTypeService', () => {
  let repository: jest.Mocked<ContentTypeRepository>;
  let service: ContentTypeService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      createMany: jest.fn(),
      find: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findOneOrCreate: jest.fn(),
      update: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    } as unknown as jest.Mocked<ContentTypeRepository>;

    service = new ContentTypeService(repository);
  });

  afterEach(jest.clearAllMocks);

  describe('create', () => {
    it('applies default fields when none are provided', async () => {
      const payload: ContentTypeCreateDto = {
        name: 'Products',
      };
      const created = Object.assign(new ContentType(), {
        id: 'type-id',
        name: payload.name,
        fields: [
          { name: 'title', label: 'Title', type: 'text' },
          { name: 'status', label: 'Status', type: 'checkbox' },
        ],
      });
      repository.create.mockResolvedValue(created);

      const result = await service.create(payload);

      expect(repository.create).toHaveBeenCalledWith({
        ...payload,
        fields: expect.arrayContaining([
          expect.objectContaining({ name: 'title' }),
          expect.objectContaining({ name: 'status' }),
        ]),
      });
      expect(result).toBe(created);
    });
  });

  describe('deleteCascadeOne', () => {
    it('delegates to the repository', async () => {
      repository.deleteOne.mockResolvedValue({
        acknowledged: true,
        deletedCount: 1,
      });

      const result = await service.deleteCascadeOne('type-id');

      expect(repository.deleteOne).toHaveBeenCalledWith('type-id');
      expect(result).toEqual({ acknowledged: true, deletedCount: 1 });
    });
  });
});
