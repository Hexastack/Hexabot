/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import {
  installInvitationFixtures,
  invitationsFixtures,
} from '@/utils/test/fixtures/invitation';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { Invitation, InvitationFull } from '../schemas/invitation.schema';

import { InvitationRepository } from './invitation.repository';
import { RoleRepository } from './role.repository';

describe('InvitationRepository', () => {
  let roleRepository: RoleRepository;
  let invitationRepository: InvitationRepository;
  let invitationModel: Model<Invitation>;
  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      models: ['PermissionModel'],
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installInvitationFixtures)],
      providers: [RoleRepository, InvitationRepository],
    });
    [roleRepository, invitationRepository, invitationModel] = await getMocks([
      RoleRepository,
      InvitationRepository,
      getModelToken(Invitation.name),
    ]);
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('findOneAndPopulate', () => {
    it('should find one invitation and populate its roles', async () => {
      jest.spyOn(invitationModel, 'findById');
      const toTestAgainst = invitationsFixtures[0];
      const invitation = await invitationRepository.findOne({
        email: toTestAgainst.email,
      });

      const roles = (await roleRepository.findAll()).filter((role) =>
        toTestAgainst.roles.includes(role.id),
      );

      const result = await invitationRepository.findOneAndPopulate(
        invitation!.id,
      );
      expect(invitationModel.findById).toHaveBeenCalledWith(
        invitation!.id,
        undefined,
      );
      expect(result).toEqualPayload({
        ...toTestAgainst,
        roles,
      });
    });
  });
  describe('findAndPopulate', () => {
    it('should find users, and for each user populate the corresponding roles', async () => {
      jest.spyOn(invitationModel, 'find');
      const pageQuery: PageQueryDto<Invitation> = getPageQuery<Invitation>();
      const allInvitations = await invitationRepository.findAll();
      const allRoles = await roleRepository.findAll();
      const result = await invitationRepository.findAndPopulate(
        {},
        {
          ...pageQuery,
          sort: ['email', 'asc'],
        },
      );
      const invitationsWithRoles = allInvitations.reduce((acc, currInv) => {
        acc.push({
          ...currInv,
          roles: allRoles.filter((role) => currInv.roles.includes(role.id)),
        });
        return acc;
      }, [] as InvitationFull[]);

      expect(invitationModel.find).toHaveBeenCalledWith({}, undefined);
      expect(result).toEqualPayload(invitationsWithRoles);
    });
  });
});
