/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  HttpException,
  HttpStatus,
  Injectable,
  LoggerService,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

import { TransactionManager } from './TransactionManager';

// TODO: logging / update mongodb docker file replicas
@Injectable()
export class TransactionManagerFactory {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private loggerService: LoggerService,
  ) {}

  async create(): Promise<TransactionManager> {
    const session = await this.connection.startSession().catch((_err) => {
      throw new HttpException(
        `Something went wrong while start transaction session`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });
    return new TransactionManager(session);
  }
}
