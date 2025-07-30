/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Document,
  Model,
  Query,
  UpdateQuery,
  UpdateWithAggregationPipeline,
} from 'mongoose';

import { BotStatsType } from '@/analytics/schemas/bot-stats.schema';
import { BaseRepository } from '@/utils/generics/base-repository';
import { TFilterQuery } from '@/utils/types/filter.types';

import { SubscriberDto, SubscriberUpdateDto } from '../dto/subscriber.dto';
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
  SubscriberFull,
  SubscriberDto
> {
  constructor(@InjectModel(Subscriber.name) readonly model: Model<Subscriber>) {
    super(model, Subscriber, SUBSCRIBER_POPULATE, SubscriberFull);
  }

  /**
   * Emits events related to the creation of a new subscriber.
   *
   * @param created - The newly created subscriber document.
   */
  async postCreate(created: SubscriberDocument): Promise<void> {
    this.eventEmitter.emit(
      'hook:stats:entry',
      BotStatsType.new_users,
      'New users',
      created,
    );
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

    if ('assignedTo' in subscriberUpdates) {
      // In case of a handover or handback, emit events
      const oldSubscriber = await this.findOne(criteria);

      if (!oldSubscriber) {
        throw new Error('Something went wrong: subscriber does not exist');
      }

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
          subscriberUpdates.assignedAt = new Date();
        }
      }
    }
  }

  /**
   * Constructs a query to find a subscriber by their foreign ID.
   *
   * @param id - The foreign ID of the subscriber.
   *
   * @returns The constructed query object.
   */
  findByForeignIdQuery(id: string) {
    return this.findQuery(
      { foreign_id: id },
      { skip: 0, limit: 1, sort: ['lastvisit', 'desc'] },
    );
  }

  /**
   * Finds a single subscriber by his foreign ID (channel's id).
   *
   * @param id - The foreign ID of the subscriber.
   *
   * @returns The found subscriber entity, or `null` if no subscriber is found.
   */
  async findOneByForeignId(id: string): Promise<Subscriber | null> {
    const query = this.findByForeignIdQuery(id);
    const [result] = await this.execute(query, Subscriber);
    return result || null;
  }

  /**
   * Finds a subscriber by their foreign ID and populates related fields such as `labels` and `assignedTo`.
   *
   * @param id - The foreign ID of the subscriber.
   *
   * @returns The found subscriber entity with populated fields.
   */
  async findOneByForeignIdAndPopulate(id: string): Promise<SubscriberFull> {
    const query = this.findByForeignIdQuery(id).populate(this.populatePaths);
    const [result] = await this.execute(query, SubscriberFull);
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

  /**
   * Updates a subscriber's labels atomically.
   *
   * - If `labelsToPull` is empty, adds `labelsToPush` without duplicates.
   * - Otherwise, removes `labelsToPull` then adds `labelsToPush`.
   *
   * @param subscriberId - The `_id` of the subscriber.
   * @param labelsToPush - Label IDs to add.
   * @param labelsToPull - Optional label IDs to remove before adding.
   *
   * @returns The subscriber document (pre-update by default), or `null` if not found.
   */
  async updateLabels(
    subscriberId: string,
    labelsToPush: string[],
    labelsToPull: string[] = [],
  ) {
    if (labelsToPull.length > 0) {
      const updateResult = await this.model.updateOne(
        { _id: subscriberId },
        { $pull: { labels: { $in: labelsToPull } } },
      );

      if (updateResult.matchedCount === 0) {
        throw new Error(`Unable to pull subscriber labels : ${subscriberId}`);
      }
    }

    const query = this.model.findOneAndUpdate(
      { _id: subscriberId },
      { $addToSet: { labels: { $each: labelsToPush } } },
      { new: true },
    );

    const result = await this.executeOne(query, Subscriber);

    if (!result) {
      throw new Error(`Unable to assign subscriber labels : ${subscriberId}`);
    }

    return result;
  }
}
