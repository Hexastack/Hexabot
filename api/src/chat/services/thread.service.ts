/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';

import { BaseService } from '@/utils/generics/base-service';

import { ThreadRepository } from '../repositories/thread.repository';
import { SubscriberStub } from '../schemas/subscriber.schema';
import { Thread, ThreadFull, ThreadPopulate } from '../schemas/thread.schema';

@Injectable()
export class ThreadService extends BaseService<
  Thread,
  ThreadPopulate,
  ThreadFull
> {
  constructor(private readonly threadRepository: ThreadRepository) {
    super(threadRepository);
  }

  /**
   * Retrieves the latest thread for a given subscriber
   *
   * @param subscriber The subscriber whose thread is being retrieved.
   *
   * @returns Last thread
   */
  async findLast<S extends SubscriberStub>(subscriber: S) {
    const [thread] = await this.findPage(
      {
        subscriber: subscriber.id,
      },
      { skip: 0, limit: 1, sort: ['createdAt', 'desc'] },
    );
    return thread;
  }
}
