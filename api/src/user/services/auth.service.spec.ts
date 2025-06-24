/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { installUserFixtures } from '@/utils/test/fixtures/user';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { UserRepository } from '../repositories/user.repository';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: UserRepository;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installUserFixtures)],
      providers: [AuthService],
    });
    [authService, userRepository] = await getMocks([
      AuthService,
      UserRepository,
    ]);
    jest.spyOn(userRepository, 'findOne');
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('validateUser', () => {
    const searchCriteria = { email: 'admin@admin.admin' };

    it('should successfully validate user with the correct password', async () => {
      const user = await userRepository.findOne(searchCriteria);
      const result = await authService.validateUser(
        'admin@admin.admin',
        'adminadmin',
      );
      expect(userRepository.findOne).toHaveBeenCalledWith(
        searchCriteria,
        {},
        undefined,
      );
      expect(result!.id).toBe(user!.id);
    });
    it('should not validate user if the provided password is incorrect', async () => {
      const result = await authService.validateUser(
        'admin@admin.admin',
        'randomPassword',
      );
      expect(userRepository.findOne).toHaveBeenCalledWith(
        searchCriteria,
        {},
        undefined,
      );
      expect(result).toBeNull();
    });

    it("should not validate user's password if the user does not exist", async () => {
      const result = await authService.validateUser(
        'admin2@admin.admin',
        'admin',
      );
      expect(userRepository.findOne).toHaveBeenCalledWith(
        {
          email: 'admin2@admin.admin',
        },
        {},
        undefined,
      );
      expect(result).toBeNull();
    });
  });
});
