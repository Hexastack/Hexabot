/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Injectable } from '@nestjs/common';
import { compareSync } from 'bcryptjs';

import { UserService } from './user.service';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  /**
   * Validates a user by checking if the provided email and password are correct.
   * It retrieves the user by email from the UserService and compares the hashed password.
   *
   * @param email - The user's email address.
   * @param password - The user's password to validate.
   *
   * @returns The user object if the credentials are valid, or null if they are invalid.
   */
  async validateUser(email: string, password: string) {
    const user = await this.userService.findOne(
      {
        email,
      },
      {},
    );

    if (user && compareSync(password, user.password)) {
      return user;
    }
    return null;
  }
}
