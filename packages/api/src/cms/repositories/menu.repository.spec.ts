/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Repository } from 'typeorm';

import { Menu } from '../entities/menu.entity';
import { MenuType } from '../types/menu';

import { MenuRepository } from './menu.repository';

const createRepositoryMock = () =>
  ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  }) as unknown as jest.Mocked<Repository<Menu>>;

describe('MenuRepository', () => {
  let ormRepository: jest.Mocked<Repository<Menu>>;
  let repository: MenuRepository;

  beforeEach(() => {
    ormRepository = createRepositoryMock();
    repository = new MenuRepository(ormRepository);
  });

  describe('preCreate validation', () => {
    it('allows nested menu without payload', async () => {
      await expect(
        (repository as any).preCreate({
          title: 'Root',
          type: MenuType.nested,
        }),
      ).resolves.toBeUndefined();
    });

    it('requires payload for postback menu', async () => {
      await expect(
        (repository as any).preCreate({
          title: 'Postback',
          type: MenuType.postback,
        }),
      ).rejects.toThrow(
        "Menu Validation Error: doesn't include payload for type postback",
      );
    });

    it('requires url for web_url menu', async () => {
      await expect(
        (repository as any).preCreate({
          title: 'Link',
          type: MenuType.web_url,
        }),
      ).rejects.toThrow(
        "Menu Validation Error: doesn't include url for type web_url",
      );
    });
  });

  describe('preUpdate validation', () => {
    it('prevents updating menu type after creation', async () => {
      await expect(
        (repository as any).preUpdate(
          {
            id: 'menu-1',
            title: 'Existing',
            type: MenuType.nested,
          },
          { type: MenuType.web_url },
        ),
      ).rejects.toThrow("Illegal Update: can't update type");
    });

    it('validates payload when updating postback menu', async () => {
      await expect(
        (repository as any).preUpdate(
          {
            id: 'menu-2',
            title: 'Postback',
            type: MenuType.postback,
          },
          { payload: 'click' },
        ),
      ).resolves.toBeUndefined();
    });
  });
});
