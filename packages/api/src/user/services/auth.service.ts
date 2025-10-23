/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { compareSync } from 'bcryptjs';

import { User } from '../dto/user.dto';
import { UserRepository } from '../repositories/user.repository';
import { hash } from '../utilities/bcryptjs';
import { UserService } from './user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly userRepository: UserRepository,
  ) {}

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
    const entity = await this.userRepository.findOneByEmailWithPassword(email);

    if (entity) {
      const isValid =
        compareSync(password, entity.password) ||
        hash(password) === entity.password;
      if (!isValid) {
        return null;
      }

      const dto =
        (await this.userService.findOne(entity.id)) ??
        ((await this.userRepository.findOne(entity.id)) as User | null);
      if (dto) {
        return dto;
      }

      return {
        id: entity.id,
        username: entity.username,
        first_name: entity.first_name,
        last_name: entity.last_name,
        email: entity.email,
        roles: entity.roleIds ?? [],
        avatar: entity.avatarId ?? null,
        sendEmail: entity.sendEmail,
        state: entity.state,
        language: entity.language,
        timezone: entity.timezone,
        resetCount: entity.resetCount,
        resetToken: entity.resetToken ?? null,
        provider: entity.provider,
        password: undefined,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      } as User;
    }
    return null;
  }
}
