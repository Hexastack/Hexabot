/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { SessionUser } from 'express-session';

import { User } from '../schemas/user.schema';
import { UserService } from '../services/user.service';

@Injectable()
export class AuthSerializer extends PassportSerializer {
  constructor(private readonly userService: UserService) {
    super();
  }

  serializeUser(
    user: User,
    done: (err: Error | null, user: SessionUser) => void,
  ) {
    done(null, {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
    });
  }

  async deserializeUser(
    payload: SessionUser,
    done: (err: Error | null, user: SessionUser | null) => void,
  ) {
    const user = payload.id ? await this.userService.findOne(payload.id) : null;
    done(null, user);
  }
}
