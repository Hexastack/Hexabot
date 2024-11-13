/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';

import {
  Thread,
  THREAD_POPULATE,
  ThreadFull,
  ThreadPopulate,
} from '../schemas/thread.schema';

@Injectable()
export class ThreadRepository extends BaseRepository<
  Thread,
  ThreadPopulate,
  ThreadFull
> {
  constructor(
    readonly eventEmitter: EventEmitter2,
    @InjectModel(Thread.name) readonly model: Model<Thread>,
  ) {
    super(eventEmitter, model, Thread, THREAD_POPULATE, ThreadFull);
  }
}
