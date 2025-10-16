/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Cache } from 'cache-manager';

import { MenuCreateDto } from '../dto/menu.dto';
import { Menu } from '../entities/menu.entity';
import { MenuRepository } from '../repositories/menu.repository';
import { MenuService } from './menu.service';
import { MenuType } from '../types/menu';

const createMenu = (overrides: Partial<Menu> = {}): Menu =>
  Object.assign(new Menu(), {
    id: 'menu-id',
    title: 'Root menu',
    type: MenuType.nested,
    parent: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

describe('MenuService', () => {
  let repository: any;
  let cacheManager: jest.Mocked<Cache>;
  let service: MenuService;

  beforeEach(() => {
    repository = {
      find: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
      findOneOrCreate: jest.fn(),
    };

    cacheManager = {
      del: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<Cache>;

    service = new MenuService(
      repository as unknown as MenuRepository,
      cacheManager,
    );
  });

  afterEach(jest.clearAllMocks);

  describe('create', () => {
    it('creates menu when parent is nested', async () => {
      const parent = createMenu({ id: 'parent-id' });
      const payload: MenuCreateDto = {
        title: 'Child',
        parent: parent.id,
        type: MenuType.nested,
      };
      repository.findOne.mockResolvedValueOnce(parent);
      repository.create.mockResolvedValueOnce(createMenu(payload));

      const result = await service.create(payload);

      expect(repository.create).toHaveBeenCalledWith(payload);
      expect(result.title).toEqual('Child');
    });

    it('throws when parent is not nested', async () => {
      const parent = createMenu({ id: 'parent-id', type: MenuType.postback });
      repository.findOne.mockResolvedValue(parent);

      await expect(
        service.create({
          title: 'Invalid child',
          parent: parent.id,
          type: MenuType.nested,
        }),
      ).rejects.toThrow("Cant't nest non nested menu");
    });

    it('throws when parent does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          title: 'Child',
          parent: 'missing',
          type: MenuType.nested,
        }),
      ).rejects.toThrow('The parent of this object does not exist');
    });
  });

  describe('updateOne', () => {
    it('validates the new parent when provided', async () => {
      const parent = createMenu({ id: 'parent-id' });
      repository.findOne.mockResolvedValue(parent);
      repository.updateOne.mockResolvedValue(createMenu({ parent: parent.id }));

      await (service as any).updateOne('menu-id', { parent: parent.id });

      expect(repository.updateOne).toHaveBeenCalledWith(
        'menu-id',
        { parent: parent.id },
        undefined,
      );
    });
  });

  describe('deepDelete', () => {
    it('deletes menu and its descendants', async () => {
      const root = createMenu({ id: 'root' });
      const child = createMenu({ id: 'child', parent: 'root' });
      const grandChild = createMenu({ id: 'grand', parent: 'child' });

      repository.findOne.mockImplementation(async (id: string) => {
        if (id === 'root') return root;
        if (id === 'child') return child;
        if (id === 'grand') return grandChild;
        return null;
      });
      repository.find.mockImplementation(async (criteria: any) => {
        const parentId = criteria?.parent;
        switch (parentId) {
          case 'root':
            return [child];
          case 'child':
            return [grandChild];
          default:
            return [];
        }
      });
      repository.deleteOne.mockResolvedValue({ acknowledged: true, deletedCount: 1 });

      const deleted = await service.deepDelete('root');

      expect(repository.deleteOne).toHaveBeenCalledTimes(3);
      expect(deleted).toEqual(3);
    });
  });

  describe('getTree', () => {
    it('returns hierarchical tree', async () => {
      const root = createMenu({ id: 'root' });
      const child = createMenu({ id: 'child', parent: 'root' });
      const nested = createMenu({ id: 'nested', parent: 'child', type: MenuType.postback });

      repository.findAll.mockResolvedValue([root, child, nested]);

      const tree = await service.getTree();

      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe('root');
      expect(tree[0].call_to_actions).toHaveLength(1);
      expect(tree[0].call_to_actions?.[0].id).toBe('child');
    });
  });

  describe('handleMenuUpdateEvent', () => {
    it('invalidates cache', async () => {
      await service.handleMenuUpdateEvent();
      expect(cacheManager.del).toHaveBeenCalledWith(expect.stringContaining('menu'));
    });
  });
});
