/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';

import { LoggerService } from '@/logger/logger.service';
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

import { Invitation, InvitationModel } from '../schemas/invitation.schema';
import { PermissionModel } from '../schemas/permission.schema';
import { RoleModel } from '../schemas/role.schema';

import { InvitationRepository } from './invitation.repository';
import { PermissionRepository } from './permission.repository';
import { RoleRepository } from './role.repository';

describe('InvitationRepository', () => {
  let roleRepository: RoleRepository;
  let invitationRepository: InvitationRepository;
  let invitationModel: Model<Invitation>;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(installInvitationFixtures),
        MongooseModule.forFeature([
          RoleModel,
          PermissionModel,
          InvitationModel,
        ]),
      ],
      providers: [
        RoleRepository,
        InvitationRepository,
        PermissionRepository,
        LoggerService,
        EventEmitter2,
      ],
    }).compile();
    roleRepository = module.get<RoleRepository>(RoleRepository);
    invitationRepository =
      module.get<InvitationRepository>(InvitationRepository);
    invitationModel = module.get<Model<Invitation>>(
      getModelToken('Invitation'),
    );
  });
  afterAll(async () => {
    await closeInMongodConnection();
  });

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
        invitation.id,
      );
      expect(invitationModel.findById).toHaveBeenCalledWith(
        invitation.id,
        undefined,
      );
      expect(result).toEqualPayload({
        ...toTestAgainst,
        roles,
      });
    });
  });
  describe('findPageAndPopulate', () => {
    it('should find users, and for each user populate the corresponding roles', async () => {
      jest.spyOn(invitationModel, 'find');
      const pageQuery: PageQueryDto<Invitation> = getPageQuery<Invitation>();
      jest.spyOn(invitationRepository, 'findPageAndPopulate');
      const allInvitations = await invitationRepository.findAll();
      const allRoles = await roleRepository.findAll();
      const result = await invitationRepository.findPageAndPopulate(
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
      }, []);

      expect(invitationModel.find).toHaveBeenCalledWith({}, undefined);
      expect(result).toEqualPayload(invitationsWithRoles);
    });
  });
});
