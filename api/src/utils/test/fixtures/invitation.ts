/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import mongoose from 'mongoose';

import { InvitationModel, Invitation } from '@/user/schemas/invitation.schema';
import { hash } from '@/user/utilities/hash';

import { getFixturesWithDefaultValues } from '../defaultValues';
import { TFixtures } from '../types';

import { installRoleFixtures } from './role';

const invitations: TFixtures<Invitation>[] = [
  {
    email: 'email@test.com',
    roles: ['0'],
    token: hash('testtoken'),
  },
];

export const invitationsFixtures = getFixturesWithDefaultValues({
  fixtures: invitations,
});

export const installInvitationFixtures = async () => {
  const roles = await installRoleFixtures();
  const invitation = mongoose.model(
    InvitationModel.name,
    InvitationModel.schema,
  );
  const invitations = await invitation.insertMany(
    invitationsFixtures.map((invitationsFixture) => ({
      ...invitationsFixture,
      roles: roles
        .map((role) => role.id)
        .filter((_, index) =>
          invitationsFixture.roles.includes(index.toString()),
        ),
    })),
  );
  invitationsFixtures.forEach((invitationFixture, index) => {
    invitationFixture.roles = invitations[index].roles.map((role) =>
      role.toString(),
    );
  });
  return { roles, invitations };
};
