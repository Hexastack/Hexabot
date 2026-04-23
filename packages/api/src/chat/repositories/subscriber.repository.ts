/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Subscriber, SubscriberFull } from '@hexabot-ai/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';

import { EUserProfileType } from '@/user/entities/user-profile.entity';
import {
  BaseOrmRepository,
  FindAllOptions,
} from '@/utils/generics/base-orm.repository';

import { SubscriberUpdateDto } from '../dto/subscriber.dto';
import { SubscriberOrmEntity } from '../entities/subscriber.entity';

@Injectable()
export class SubscriberRepository extends BaseOrmRepository<SubscriberOrmEntity> {
  constructor(
    @InjectRepository(SubscriberOrmEntity)
    repository: Repository<SubscriberOrmEntity>,
  ) {
    super(repository, ['labels', 'assignedTo', 'avatar']);
  }

  /**
   * Finds a single subscriber by his foreign ID (channel's id).
   *
   * @param id - The foreign ID of the subscriber.
   *
   * @returns The found subscriber entity, or `null` if no subscriber is found.
   */
  async findOneByForeignId(id: string): Promise<Subscriber | null> {
    return await this.findOne({
      where: { foreignId: id },
      order: { lastvisit: 'DESC' },
    });
  }

  /**
   * Finds a subscriber by their foreign ID and populates related fields such as `labels` and `assignedTo`.
   *
   * @param id - The foreign ID of the subscriber.
   *
   * @returns The found subscriber entity with populated fields.
   */
  async findOneByForeignIdAndPopulate(
    id: string,
  ): Promise<SubscriberFull | null> {
    const result = await this.findOneAndPopulate({
      where: { foreignId: id },
      order: { lastvisit: 'DESC' },
    });

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
    return await this.updateOne(
      {
        where: { foreignId: id },
      },
      updates,
    );
  }

  /**
   * Unassigns a subscriber by their foreign ID by setting the `assignedTo` field to `null`.
   *
   * @param foreignId - The foreign ID of the subscriber.
   *
   * @returns The updated subscriber entity.
   */
  async handBackByForeignIdQuery(foreignId: string): Promise<Subscriber> {
    const previous = await this.findOneByForeignId(foreignId);
    const updated = await this.updateOne(
      {
        where: {
          foreignId,
        },
      },
      {
        assignedTo: null,
        assignedAt: null,
      },
    );

    if (previous && previous.assignedTo !== updated.assignedTo) {
      this.eventEmitter?.emit(
        'hook:subscriber:assign',
        {
          assignedTo: updated.assignedTo,
          assignedAt: updated.assignedAt,
        },
        previous,
      );
    }

    return updated;
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
        where: {
          foreignId,
        },
      },
      {
        assignedTo: userId,
        assignedAt: new Date(),
      },
    );
  }

  /**
   * Counts currently assigned subscribers by assignee user ID.
   */
  async countAssignedSubscribersByUserIds(
    userIds: string[],
  ): Promise<Record<string, number>> {
    if (!userIds.length) {
      return {};
    }

    const rows = await this.repository
      .createQueryBuilder('subscriber')
      .select('subscriber.assigned_to_id', 'assigneeId')
      .addSelect('COUNT(*)', 'assignedCount')
      .where('subscriber.type = :subscriberType', {
        subscriberType: EUserProfileType.SubscriberOrmEntity,
      })
      .andWhere('subscriber.assigned_to_id IN (:...userIds)', { userIds })
      .groupBy('subscriber.assigned_to_id')
      .getRawMany<{ assigneeId: string; assignedCount: string }>();

    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.assigneeId] = Number(row.assignedCount || 0);

      return acc;
    }, {});
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
   * @returns The subscriber object (pre-update by default), or `null` if not found.
   */
  async updateLabels(
    subscriberId: string,
    labelsToPush: string[],
    labelsToPull: string[] = [],
  ): Promise<Subscriber> {
    const subscriber = await this.findOne(subscriberId);

    if (!subscriber) {
      throw new Error(`Unable to resolve subscriber ${subscriberId}`);
    }

    const relationQuery = this.repository
      .createQueryBuilder()
      .relation(SubscriberOrmEntity, 'labels')
      .of(subscriberId);
    const existingIds = new Set(subscriber.labels);

    if (labelsToPull.length) {
      await relationQuery.remove(labelsToPull);
      labelsToPull.forEach((id) => existingIds.delete(id));
    }

    const labelIdsToAdd = Array.from(new Set(labelsToPush)).filter((id) => {
      const shouldAdd = !existingIds.has(id);
      if (shouldAdd) {
        existingIds.add(id);
      }

      return shouldAdd;
    });

    if (labelIdsToAdd.length) {
      await relationQuery.add(labelIdsToAdd);
    }

    const refreshed = await this.findOne(subscriberId);

    if (!refreshed) {
      throw new Error(`Unable to reload subscriber ${subscriberId}`);
    }

    return refreshed;
  }

  async findAll(
    options?: FindAllOptions<SubscriberOrmEntity>,
  ): Promise<Subscriber[]> {
    return await super.find({
      where: { type: EUserProfileType.SubscriberOrmEntity },
      ...options,
    });
  }

  async findAndPopulate(
    options?: FindManyOptions<SubscriberOrmEntity>,
  ): Promise<SubscriberFull[]> {
    return await super.findAndPopulate({
      where: { type: EUserProfileType.SubscriberOrmEntity },
      ...options,
    });
  }
}
