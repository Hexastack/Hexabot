/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import mongoose from 'mongoose';
import { DataSource } from 'typeorm';

import { PermissionCreateDto } from '@/user/dto/permission.dto';
import { ModelOrmEntity as ModelEntity } from '@/user/entities/model.entity';
import { PermissionOrmEntity as PermissionEntity } from '@/user/entities/permission.entity';
import { RoleOrmEntity as RoleEntity } from '@/user/entities/role.entity';
import { PermissionModel } from '@/user/schemas/permission.schema';
import { Action } from '@/user/types/action.type';

import {
  installModelFixtures,
  installModelFixturesTypeOrm,
  modelOrmFixtures,
} from './model';
import { installRoleFixturesTypeOrm, roleOrmFixtures } from './role';
import { installUserFixtures, installUserFixturesTypeOrm } from './user';

type PermissionOrmFixture = PermissionCreateDto & { id: string };

export const permissionOrmFixtures: PermissionOrmFixture[] = [
  {
    id: '77777777-7777-7777-7777-777777777777',
    model: modelOrmFixtures[0].id,
    action: Action.CREATE,
    role: roleOrmFixtures[0].id,
    relation: 'role',
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    model: modelOrmFixtures[0].id,
    action: Action.DELETE,
    role: roleOrmFixtures[0].id,
    relation: 'role',
  },
  {
    id: '99999999-9999-9999-9999-999999999999',
    model: modelOrmFixtures[0].id,
    action: Action.READ,
    role: roleOrmFixtures[1].id,
    relation: 'role',
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    model: modelOrmFixtures[0].id,
    action: Action.UPDATE,
    role: roleOrmFixtures[0].id,
    relation: 'role',
  },
];

export const permissionFixtures: PermissionCreateDto[] =
  permissionOrmFixtures.map(({ id: _id, ...permission }) => permission);

export const installPermissionFixtures = async () => {
  const { users, roles } = await installUserFixtures();
  const models = await installModelFixtures();

  const roleIdsByFixtureId = new Map<string, string>();
  roleOrmFixtures.forEach((fixture, index) => {
    const role = roles[index];
    if (role) {
      roleIdsByFixtureId.set(fixture.id, role.id.toString());
    }
  });

  const modelIdsByFixtureId = new Map<string, string>();
  modelOrmFixtures.forEach((fixture, index) => {
    const model = models[index];
    if (model) {
      modelIdsByFixtureId.set(fixture.id, model.id.toString());
    }
  });

  const Permission = mongoose.model(
    PermissionModel.name,
    PermissionModel.schema,
  );

  const permissions = await Permission.insertMany(
    permissionOrmFixtures.map((permissionFixture) => ({
      ...permissionFixture,
      model:
        modelIdsByFixtureId.get(permissionFixture.model) ??
        permissionFixture.model,
      role:
        roleIdsByFixtureId.get(permissionFixture.role) ??
        permissionFixture.role,
    })),
  );

  return { roles, users, permissions };
};

export const installPermissionFixturesTypeOrm = async (
  dataSource: DataSource,
) => {
  const modelRepository = dataSource.getRepository(ModelEntity);
  const roleRepository = dataSource.getRepository(RoleEntity);
  const permissionRepository = dataSource.getRepository(PermissionEntity);

  const models =
    (await modelRepository.count()) === 0
      ? await installModelFixturesTypeOrm(dataSource)
      : await modelRepository.find();

  const roles =
    (await roleRepository.count()) === 0
      ? await installRoleFixturesTypeOrm(dataSource)
      : await roleRepository.find();

  const users = await installUserFixturesTypeOrm(dataSource);

  if (await permissionRepository.count()) {
    return await permissionRepository.find({ relations: ['model', 'role'] });
  }

  const entities = permissionOrmFixtures.map((fixture) =>
    permissionRepository.create({
      id: fixture.id,
      action: fixture.action,
      relation: fixture.relation,
      modelId: fixture.model,
      roleId: fixture.role,
      model: { id: fixture.model } as ModelEntity,
      role: { id: fixture.role } as RoleEntity,
    }),
  );

  await permissionRepository.save(entities);

  return { models, roles, users, permissions: entities };
};
