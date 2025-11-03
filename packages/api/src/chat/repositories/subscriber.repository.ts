/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository, UpdateEvent } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';
import { DtoTransformer } from '@/utils/types/dto.types';

import {
  Subscriber,
  SubscriberDtoConfig,
  SubscriberFull,
  SubscriberTransformerDto,
  SubscriberUpdateDto,
} from '../dto/subscriber.dto';
import { SubscriberOrmEntity } from '../entities/subscriber.entity';

@Injectable()
export class SubscriberRepository extends BaseOrmRepository<
  SubscriberOrmEntity,
  SubscriberTransformerDto,
  SubscriberDtoConfig
> {
  constructor(
    @InjectRepository(SubscriberOrmEntity)
    repository: Repository<SubscriberOrmEntity>,
  ) {
    super(repository, ['labels', 'assignedTo', 'avatar'], {
      PlainCls: Subscriber,
      FullCls: SubscriberFull,
    });
  }

  /**
   * Runs before a subscriber update to detect assignment changes and emit the appropriate events.
   *
   * @param event - The TypeORM update event describing the current and previous entity state.
   */
  async beforeUpdate(event: UpdateEvent<SubscriberOrmEntity>): Promise<void> {
    const entity = event.entity as SubscriberOrmEntity | undefined;
    const previous = event.databaseEntity as SubscriberOrmEntity | undefined;

    if (entity && previous) {
      const updatedColumns = event.updatedColumns ?? [];
      const updatedRelations = event.updatedRelations ?? [];
      const assignmentUpdated =
        updatedColumns.some(
          ({ propertyName }) => propertyName === 'assignedTo',
        ) ||
        updatedRelations.some(
          ({ propertyName }) => propertyName === 'assignedTo',
        );

      if (assignmentUpdated) {
        const newAssignedTo = entity?.id;
        const previousAssignedTo = previous?.id;

        if (newAssignedTo !== previousAssignedTo) {
          const previousSubscriber = this.getTransformer(
            DtoTransformer.PlainCls,
          )(previous);

          const subscriberUpdates: SubscriberUpdateDto = {
            assignedTo: newAssignedTo ?? null,
          };

          this.eventEmitter?.emit(
            'hook:subscriber:assign',
            subscriberUpdates,
            previousSubscriber,
          );

          const newAssignmentExists = Boolean(newAssignedTo);
          const previousAssignmentExists = Boolean(previousAssignedTo);

          if (!(newAssignmentExists && previousAssignmentExists)) {
            const assignedAt = new Date();
            subscriberUpdates.assignedAt = assignedAt;
            entity.assignedAt = assignedAt;
          }
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
  private createForeignIdOptions(
    id: string,
  ): FindManyOptions<SubscriberOrmEntity> {
    return {
      where: { foreign_id: id },
      order: { lastvisit: 'DESC' },
      take: 1,
    };
  }

  /**
   * Finds a single subscriber by his foreign ID (channel's id).
   *
   * @param id - The foreign ID of the subscriber.
   *
   * @returns The found subscriber entity, or `null` if no subscriber is found.
   */
  async findOneByForeignId(id: string): Promise<Subscriber | null> {
    const results = await this.find(this.createForeignIdOptions(id));
    const [result] = results;
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
    const results = await this.findAndPopulate(this.createForeignIdOptions(id));
    const [result] = results;
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
        where: { foreign_id: id },
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
    return await this.updateOne(
      {
        where: {
          foreign_id: foreignId,
        },
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
        where: {
          foreign_id: foreignId,
        },
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
}
