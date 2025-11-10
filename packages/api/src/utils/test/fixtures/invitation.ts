/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource } from 'typeorm';

import { Invitation } from '@/user/dto/invitation.dto';
import { InvitationOrmEntity as InvitationEntity } from '@/user/entities/invitation.entity';
import { RoleOrmEntity as RoleEntity } from '@/user/entities/role.entity';
import { hash } from '@/user/utilities/hash';

import { getFixturesWithDefaultValues } from '../defaultValues';
import { TFixtures } from '../types';

import { installRoleFixturesTypeOrm, roleOrmFixtures } from './role';

type InvitationOrmFixture = TFixtures<Invitation> & { id: string };

const invitations: InvitationOrmFixture[] = [
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    email: 'email@test.com',
    roles: [roleOrmFixtures[0].id],
    token: hash('testtoken'),
  },
];

export const invitationsFixtures = getFixturesWithDefaultValues({
  fixtures: invitations,
});

export const installInvitationFixturesTypeOrm = async (
  dataSource: DataSource,
) => {
  const roleRepository = dataSource.getRepository(RoleEntity);
  const invitationRepository = dataSource.getRepository(InvitationEntity);
  const roles =
    (await roleRepository.count()) === 0
      ? await installRoleFixturesTypeOrm(dataSource)
      : await roleRepository.find();

  if (await invitationRepository.count()) {
    return await invitationRepository.find({ relations: ['roles'] });
  }

  const roleByFixtureId = new Map<string, RoleEntity>();
  roleOrmFixtures.forEach((fixture, index) => {
    const role = roles[index];
    if (role) {
      roleByFixtureId.set(fixture.id, role);
    }
  });

  const entities = invitationsFixtures.map((fixture) =>
    invitationRepository.create({
      id: fixture.id,
      email: fixture.email,
      token: fixture.token,
      roles: fixture.roles
        .map((roleId) => roleByFixtureId.get(roleId))
        .filter((role): role is RoleEntity => Boolean(role)),
    }),
  );

  return await invitationRepository.save(entities);
};
