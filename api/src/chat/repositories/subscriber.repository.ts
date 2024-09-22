/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import {
  Document,
  Model,
  Query,
  TFilterQuery,
  UpdateQuery,
  UpdateWithAggregationPipeline,
} from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';

import { SubscriberUpdateDto } from '../dto/subscriber.dto';
import {
  Subscriber,
  SUBSCRIBER_POPULATE,
  SubscriberDocument,
  SubscriberFull,
  SubscriberPopulate,
} from '../schemas/subscriber.schema';

@Injectable()
export class SubscriberRepository extends BaseRepository<
  Subscriber,
  SubscriberPopulate,
  SubscriberFull
> {
  constructor(
    @InjectModel(Subscriber.name) readonly model: Model<Subscriber>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super(model, Subscriber, SUBSCRIBER_POPULATE, SubscriberFull);
  }

  /**
   * Emits events related to the creation of a new subscriber.
   *
   * @param _created - The newly created subscriber document.
   */
  async postCreate(_created: SubscriberDocument): Promise<void> {
    this.eventEmitter.emit(
      'hook:stats:entry',
      'new_users',
      'New users',
      _created,
    );
    this.eventEmitter.emit('hook:chatbot:subscriber:create', _created);
  }

  /**
   * Emits events before updating a subscriber. Specifically handles the
   * assignment of the subscriber and triggers appropriate events.
   *
   * @param _query - The Mongoose query object for finding and updating a subscriber.
   * @param criteria - The filter criteria used to find the subscriber.
   * @param updates - The update data, which may include fields like `assignedTo`.
   */
  async preUpdate(
    _query: Query<
      Document<Subscriber, any, any>,
      Document<Subscriber, any, any>,
      unknown,
      Subscriber,
      'findOneAndUpdate'
    >,
    criteria: TFilterQuery<Subscriber>,
    updates:
      | UpdateWithAggregationPipeline
      | UpdateQuery<Document<Subscriber, any, any>>,
  ): Promise<void> {
    const subscriberUpdates: SubscriberUpdateDto = updates?.['$set'];

    this.eventEmitter.emit(
      'hook:chatbot:subscriber:update:before',
      criteria,
      subscriberUpdates,
    );

    const oldSubscriber = await this.findOne(criteria);

    if (subscriberUpdates.assignedTo !== oldSubscriber?.assignedTo) {
      this.eventEmitter.emit(
        'hook:subscriber:assign',
        subscriberUpdates,
        oldSubscriber,
      );

      if (!(subscriberUpdates.assignedTo && oldSubscriber?.assignedTo)) {
        this.eventEmitter.emit(
          'hook:analytics:passation',
          oldSubscriber,
          !!subscriberUpdates?.assignedTo,
        );
      }
    }
  }

  /**
   * Emits an event after successfully updating a subscriber.
   * Triggers the event with the updated subscriber data.
   *
   * @param _query - The Mongoose query object for finding and updating a subscriber.
   * @param updated - The updated subscriber entity.
   */
  async postUpdate(
    _query: Query<
      Document<Subscriber, any, any>,
      Document<Subscriber, any, any>,
      unknown,
      Subscriber,
      'findOneAndUpdate'
    >,
    updated: Subscriber,
  ) {
    this.eventEmitter.emit('hook:chatbot:subscriber:update:after', updated);
  }

  /**
   * Constructs a query to find a subscriber by their foreign ID.
   *
   * @param id - The foreign ID of the subscriber.
   *
   * @returns The constructed query object.
   */
  findByForeignIdQuery(id: string) {
    return this.findPageQuery(
      { foreign_id: id },
      { skip: 0, limit: 1, sort: ['lastvisit', 'desc'] },
    );
  }

  /**
   * Finds a single subscriber by his foreign ID (channel's id).
   *
   * @param id - The foreign ID of the subscriber.
   *
   * @returns The found subscriber entity.
   */
  async findOneByForeignId(id: string): Promise<Subscriber> {
    const query = this.findByForeignIdQuery(id);
    const [result] = await this.execute(query, Subscriber);
    return result;
  }

  /**
   * Finds a subscriber by their foreign ID and populates related fields such as `labels` and `assignedTo`.
   *
   * @param id - The foreign ID of the subscriber.
   *
   * @returns The found subscriber entity with populated fields.
   */
  async findOneByForeignIdAndPopulate(id: string): Promise<SubscriberFull> {
    const query = this.findByForeignIdQuery(id).populate(this.populate);
    const [result] = await this.execute(query, this.clsPopulate);
    return result;
  }

  /**
   * Updates a subscriber's information based on their foreign ID.
   *
   * @param id - The foreign ID of the subscriber.
   * @param updates - The update data to apply to the subscriber.
   *
   * @returns The updated subscriber entity.
   */
  async updateOneByForeignIdQuery(
    id: string,
    updates: SubscriberUpdateDto,
  ): Promise<Subscriber> {
    return await this.updateOne({ foreign_id: id }, updates);
  }

  /**
   * Unassigns a subscriber by their foreign ID by setting the `assignedTo` field to `null`.
   *
   * @param foreignId - The foreign ID of the subscriber.
   *
   * @returns The updated subscriber entity.
   */
  async handBackByForeignIdQuery(foreignId: string): Promise<Subscriber> {
    return await this.updateOne(
      {
        foreign_id: foreignId,
        assignedTo: { $ne: null },
      },
      {
        assignedTo: null,
      },
    );
  }

  /**
   * Assigns a subscriber to a new user by their foreign ID.
   *
   * @param foreignId The foreign ID of the subscriber.
   * @param userId The ID of the user to assign the subscriber to.
   *
   * @returns The updated subscriber entity.
   */
  async handOverByForeignIdQuery(
    foreignId: string,
    userId: string,
  ): Promise<Subscriber> {
    return await this.updateOne(
      {
        foreign_id: foreignId,
        assignedTo: { $ne: userId },
      },
      {
        assignedTo: userId,
      },
    );
  }
}
