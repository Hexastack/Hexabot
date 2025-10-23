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
    parent: '0',
    type: MenuType.postback,
    payload: 'Lignes mobiles',
    title: 'Offres mobiles',
  },
  {
    parent: '0',
    type: MenuType.nested,
    title: 'Devices',
  },
  {
    parent: '0',
    title: 'Points de Ventes et Boutiques',
    type: MenuType.postback,
    payload: 'Points de Ventes et Boutiques',
  },
];

export const devicesMenuFixtures: MenuCreateDto[] = [
  {
    parent: '4',
    type: MenuType.postback,
    payload: 'Smartphones',
    title: 'Smartphones',
  },
  {
    parent: '4',
    title: 'Tablettes',
    type: MenuType.postback,
    payload: 'Tablettes',
  },
  {
    parent: '4',
    title: 'Accessoires',
    type: MenuType.postback,
    payload: 'Accessoires',
  },
];

export const accountMenuFixtures: MenuCreateDto[] = [
  {
    parent: '1',
    type: MenuType.postback,
    payload: 'Consultation de solde',
    title: 'Consultation de solde',
  },
  {
    parent: '1',
    type: MenuType.postback,
    payload: "Achat d'options",
    title: "Achat d'options",
  },
  {
    parent: '1',
    title: 'Mon offre',
    type: MenuType.postback,
    payload: 'Mon offre',
  },
  {
    parent: '1',
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
      parent: m.parent ? docs[parseInt(m.parent)].id : undefined,
    })),
  );

  const allDocs = docs.concat(offerDocs);

  await Menu.insertMany(
    devicesMenuFixtures.map((m) => ({
      ...m,
      parent: m.parent ? allDocs[parseInt(m.parent)].id : undefined,
    })),
  );

  return await Menu.insertMany(
    accountMenuFixtures.map((m) => {
      return {
        ...m,
        parent: m.parent ? docs[parseInt(m.parent)].id : undefined,
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
          parent: toParentRelation(resolveParentId(menu.parent, roots)),
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
          parent: toParentRelation(resolveParentId(menu.parent, all)),
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
          parent: toParentRelation(resolveParentId(menu.parent, roots)),
        }),
      ),
    ),
  );
};
