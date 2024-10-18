/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
