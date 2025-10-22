/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import mongoose from 'mongoose';
import { DataSource, DeepPartial } from 'typeorm';

import { MenuCreateDto } from '@/cms/dto/menu.dto';
import { MenuOrmEntity } from '@/cms/entities/menu.entity';
import { MenuModel } from '@/cms/schemas/menu.schema';
import { MenuType } from '@/cms/types/menu';

export const websiteMenuFixture: MenuCreateDto = {
  type: MenuType.web_url,
  url: 'https://orange.tn',
  title: 'Site Web',
};

export const offerMenuFixture: MenuCreateDto = {
  title: 'Nos Offres et Nos Boutiques',
  type: MenuType.nested,
};

export const rootMenuFixtures: MenuCreateDto[] = [
  offerMenuFixture,
  {
    type: MenuType.nested,
    title: 'Gérer Mon Compte',
  },
  websiteMenuFixture,
];

export const offersMenuFixtures: MenuCreateDto[] = [
  {
    parentId: '0',
    type: MenuType.postback,
    payload: 'Lignes mobiles',
    title: 'Offres mobiles',
  },
  {
    parentId: '0',
    type: MenuType.nested,
    title: 'Devices',
  },
  {
    parentId: '0',
    title: 'Points de Ventes et Boutiques',
    type: MenuType.postback,
    payload: 'Points de Ventes et Boutiques',
  },
];

export const devicesMenuFixtures: MenuCreateDto[] = [
  {
    parentId: '4',
    type: MenuType.postback,
    payload: 'Smartphones',
    title: 'Smartphones',
  },
  {
    parentId: '4',
    title: 'Tablettes',
    type: MenuType.postback,
    payload: 'Tablettes',
  },
  {
    parentId: '4',
    title: 'Accessoires',
    type: MenuType.postback,
    payload: 'Accessoires',
  },
];

export const accountMenuFixtures: MenuCreateDto[] = [
  {
    parentId: '1',
    type: MenuType.postback,
    payload: 'Consultation de solde',
    title: 'Consultation de solde',
  },
  {
    parentId: '1',
    type: MenuType.postback,
    payload: "Achat d'options",
    title: "Achat d'options",
  },
  {
    parentId: '1',
    title: 'Mon offre',
    type: MenuType.postback,
    payload: 'Mon offre',
  },
  {
    parentId: '1',
    title: 'Obtenir mon code PUK',
    type: MenuType.postback,
    payload: 'Obtenir mon code PUK',
  },
];

export const installMenuFixtures = async () => {
  const Menu = mongoose.model(MenuModel.name, MenuModel.schema);

  const docs = await Menu.insertMany(rootMenuFixtures);

  const offerDocs = await Menu.insertMany(
    offersMenuFixtures.map((m) => ({
      ...m,
      parent: m.parentId ? docs[parseInt(m.parentId)].id : undefined,
    })),
  );

  const allDocs = docs.concat(offerDocs);

  await Menu.insertMany(
    devicesMenuFixtures.map((m) => ({
      ...m,
      parent: m.parentId ? allDocs[parseInt(m.parentId)].id : undefined,
    })),
  );

  return await Menu.insertMany(
    accountMenuFixtures.map((m) => {
      return {
        ...m,
        parent: m.parentId ? docs[parseInt(m.parentId)].id : undefined,
      };
    }),
  );
};

export const installMenuFixturesTypeOrm = async (
  dataSource: DataSource,
): Promise<void> => {
  const repository = dataSource.getRepository(MenuOrmEntity);
  MenuOrmEntity.registerEntityManagerProvider(() => repository.manager);

  const count = await repository.count();
  if (count > 0) {
    return;
  }

  const resolveParentId = (
    parent: string | undefined,
    collection: MenuOrmEntity[],
  ) => {
    if (!parent) {
      return undefined;
    }
    const idx = Number(parent);
    if (!Number.isInteger(idx) || !collection[idx]) {
      throw new Error(`Unable to resolve menu parent for index: ${parent}`);
    }
    return collection[idx].id;
  };

  const toParentRelation = (id?: string): DeepPartial<MenuOrmEntity> | null =>
    id ? ({ id } as DeepPartial<MenuOrmEntity>) : null;

  const roots = await repository.save(
    repository.create(
      rootMenuFixtures.map(
        (menu): DeepPartial<MenuOrmEntity> => ({
          title: menu.title,
          type: menu.type,
          payload: menu.payload,
          url: menu.url,
        }),
      ),
    ),
  );

  const offers = await repository.save(
    repository.create(
      offersMenuFixtures.map(
        (menu): DeepPartial<MenuOrmEntity> => ({
          title: menu.title,
          type: menu.type,
          payload: menu.payload,
          url: menu.url,
          parent: toParentRelation(resolveParentId(menu.parentId, roots)),
        }),
      ),
    ),
  );

  const all = [...roots, ...offers];

  await repository.save(
    repository.create(
      devicesMenuFixtures.map(
        (menu): DeepPartial<MenuOrmEntity> => ({
          title: menu.title,
          type: menu.type,
          payload: menu.payload,
          url: menu.url,
          parent: toParentRelation(resolveParentId(menu.parentId, all)),
        }),
      ),
    ),
  );

  await repository.save(
    repository.create(
      accountMenuFixtures.map(
        (menu): DeepPartial<MenuOrmEntity> => ({
          title: menu.title,
          type: menu.type,
          payload: menu.payload,
          url: menu.url,
          parent: toParentRelation(resolveParentId(menu.parentId, roots)),
        }),
      ),
    ),
  );
};
