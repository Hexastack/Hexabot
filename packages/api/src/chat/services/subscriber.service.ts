/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Subscriber } from '@hexabot-ai/types';
import { Inject, Injectable, Optional, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import mime from 'mime';
import { In, IsNull, Not } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { AttachmentService } from '@/attachment/services/attachment.service';
import {
  AttachmentAccess,
  AttachmentCreatedByRef,
  AttachmentFile,
  AttachmentResourceRef,
} from '@/attachment/types';
import { config } from '@/config';
import { UserService } from '@/user/services/user.service';
import { BaseOrmService } from '@/utils/generics/base-orm.service';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import { SubscriberUpdateDto } from '../dto/subscriber.dto';
import { SubscriberOrmEntity } from '../entities/subscriber.entity';
import { SubscriberRepository } from '../repositories/subscriber.repository';

import { LabelService } from './label.service';

export const SUBSCRIBER_HANDOVER_MODES = ['specific', 'auto'] as const;

export type SubscriberHandoverMode = (typeof SUBSCRIBER_HANDOVER_MODES)[number];

export type SubscriberHandoverFailureReason = 'no_available_user';

export type SubscriberHandoverPolicyInput = {
  mode: SubscriberHandoverMode;
  userId?: string;
};

export type SubscriberHandoverPolicyResult = {
  success: boolean;
  mode: SubscriberHandoverMode;
  subscriber: Subscriber;
  assignedTo: string | null;
  reason?: SubscriberHandoverFailureReason;
};

@Injectable()
export class SubscriberService extends BaseOrmService<SubscriberOrmEntity> {
  constructor(
    readonly repository: SubscriberRepository,
    protected readonly attachmentService: AttachmentService,
    protected readonly labelService: LabelService,
    protected readonly userService: UserService,
    @Optional()
    @Inject(forwardRef(() => WebsocketGateway))
    protected readonly websocketGateway?: WebsocketGateway,
  ) {
    super(repository);
  }

  /**
   * Finds and returns a single subscriber based on a foreign ID.
   *
   * @param id - The foreign ID used to find the subscriber.
   *
   * @returns The subscriber matching the foreign ID.
   */
  async findOneByForeignId(id: string) {
    return await this.repository.findOneByForeignId(id);
  }

  /**
   * Finds and returns a single subscriber based on a foreign ID,
   * and populates the result with related data.
   *
   * @param id - The foreign ID used to find the subscriber.
   *
   * @returns The subscriber with populated related data.
   */
  async findOneByForeignIdAndPopulate(id: string) {
    return await this.repository.findOneByForeignIdAndPopulate(id);
  }

  /**
   * Updates a subscriber's details based on a foreign ID.
   *
   * @param id - The foreign ID of the subscriber to update.
   * @param updates - The updates to apply to the subscriber.
   *
   * @returns The updated subscriber data.
   */
  async updateOneByForeignId(id: string, updates: SubscriberUpdateDto) {
    return await this.repository.updateOneByForeignIdQuery(id, updates);
  }

  /**
   * Hands back control or association of a subscriber based on a foreign ID.
   *
   * @param foreignId - The foreign ID of the subscriber.
   *
   * @returns The result of the hand-back operation.
   */
  async handBackByForeignId(foreignId: string) {
    return await this.repository.handBackByForeignIdQuery(foreignId);
  }

  /**
   * Hands over control or association of a subscriber to another user
   * based on the foreign ID and the new user's ID.
   *
   * @param foreignId - The foreign ID of the subscriber.
   * @param userId - The ID of the user to whom control is handed over.
   *
   * @returns The result of the hand-over operation.
   */
  async handOverByForeignId(foreignId: string, userId: string) {
    return await this.repository.handOverByForeignIdQuery(foreignId, userId);
  }

  /**
   * Persist a new avatar image for a given **Subscriber** and attach it to their profile.
   * The method is **idempotent** regarding subscriber updates: calling it again simply
   * replaces the existing avatar reference with the new one.
   *
   * @param subscriberId – The unique identifier of the subscriber
   * @param avatar       – The uploaded avatar payload containing:
   *                       - `file` – Raw binary buffer
   *                       - `type` – MIME type (e.g. `image/png`)
   *                       - `size` – File size in bytes
   *
   * @returns Resolves once the subscriber avatar is stored
   */
  async storeAvatar(
    subscriberId: string,
    avatar: AttachmentFile,
  ): Promise<Subscriber> {
    const { file, type, size } = avatar;
    const extension = mime.extension(type);
    const attachment = await this.attachmentService.store(file, {
      name: `avatar-${uuidv4()}.${extension}`,
      size,
      type,
      resourceRef: AttachmentResourceRef.SubscriberAvatar,
      access: AttachmentAccess.Private,
      createdByRef: AttachmentCreatedByRef.Subscriber,
      createdBy: subscriberId,
    });

    return await this.updateOne(subscriberId, {
      avatar: attachment.id,
    });
  }

  /**
   * Assigns subscriber new labels and handles mutually exclusive labels (belonging to the same group)
   *
   * @param subscriberId - The unique identifier of the subscriber whose labels to update
   * @param labelsToPush - Array of label ids to be assigned to the subscriber
   * @returns The updated profile (fetches once after the write)
   */
  async assignLabels(
    subscriber: Subscriber,
    labelsToPush: string[],
  ): Promise<Subscriber> {
    if (!labelsToPush || labelsToPush.length === 0) {
      throw new Error('No labels to be assigned!');
    }

    const uniqueLabelsToPush = Array.from(new Set(labelsToPush));
    const currentLabelIds = new Set(subscriber.labels);

    let labelsToPull: string[] = [];
    const newLabelIds = uniqueLabelsToPush.filter(
      (id) => !currentLabelIds.has(id),
    );

    if (newLabelIds.length > 0 && subscriber.labels.length > 0) {
      const [newMutexLabels, existingMutexLabels] = await Promise.all([
        // Retrieve new mutex group labels (if any)
        this.labelService.find({
          where: {
            id: In(newLabelIds),
            group: { id: Not(IsNull()) },
          },
        }),
        // Retrieve existing mutex group labels (if any)
        this.labelService.find({
          where: {
            id: In(subscriber.labels),
            group: { id: Not(IsNull()) },
          },
        }),
      ]);

      if (newMutexLabels.length > 0 && existingMutexLabels.length > 0) {
        const mutexGroups = new Set(
          newMutexLabels
            .map(({ group }) => group)
            .filter((group): group is string => !!group),
        );

        labelsToPull = existingMutexLabels
          .filter(
            ({ group, id }) =>
              !!group && mutexGroups.has(group) && !newLabelIds.includes(id),
          )
          .map(({ id }) => id);
      }
    }

    return await this.repository.updateLabels(
      subscriber.id,
      uniqueLabelsToPush,
      labelsToPull,
    );
  }

  /**
   * Updates subscriber labels by applying assign/remove operations.
   * Assign operations are applied first to preserve mutex semantics,
   * and overlapping label ids always keep the assignment (assign wins).
   */
  async updateLabels(
    subscriber: Subscriber,
    labelsToAssign: string[] = [],
    labelsToRemove: string[] = [],
  ): Promise<Subscriber> {
    const uniqueLabelsToAssign = Array.from(new Set(labelsToAssign));
    const labelsToAssignSet = new Set(uniqueLabelsToAssign);
    const uniqueLabelsToRemove = Array.from(new Set(labelsToRemove)).filter(
      (labelId) => !labelsToAssignSet.has(labelId),
    );

    if (
      uniqueLabelsToAssign.length === 0 &&
      uniqueLabelsToRemove.length === 0
    ) {
      throw new Error('At least one label operation is required');
    }

    let current = subscriber;

    if (uniqueLabelsToAssign.length > 0) {
      current = await this.assignLabels(current, uniqueLabelsToAssign);
    }

    if (uniqueLabelsToRemove.length > 0) {
      current = await this.repository.updateLabels(
        current.id,
        [],
        uniqueLabelsToRemove,
      );
    }

    return current;
  }

  /**
   * Resolves label ids into canonical label names while preserving input order.
   * Unknown label ids are ignored.
   */
  async resolveLabelNames(labelIds: string[] = []): Promise<string[]> {
    const uniqueLabelIds = Array.from(new Set(labelIds)).filter(
      (labelId): labelId is string =>
        typeof labelId === 'string' && labelId.length > 0,
    );
    if (!uniqueLabelIds.length) {
      return [];
    }

    const labels = await this.labelService.find({
      where: {
        id: In(uniqueLabelIds),
      },
    });
    if (!labels.length) {
      return [];
    }

    const labelNameById = new Map(
      labels.map((label) => [label.id, label.name] as const),
    );

    return uniqueLabelIds.reduce<string[]>((acc, labelId) => {
      const labelName = labelNameById.get(labelId);
      if (labelName) {
        acc.push(labelName);
      }

      return acc;
    }, []);
  }

  /**
   * Handover (assign) the subscriber to a specific user.
   * No-op if `assignTo` is falsy.
   *
   * @param profile - The end-user (subscriber) profile
   * @param assignTo - User ID to handover the discussion to
   * @returns The updated profile (or the original if no assignee was provided)
   */
  async handOver(profile: Subscriber, assignTo: string): Promise<Subscriber> {
    if (!assignTo) {
      throw new Error('Cannot handover to undefined user!');
    }

    const updated = await this.updateOne(profile.id, {
      assignedTo: assignTo,
      assignedAt: new Date(),
    });

    await this.eventEmitter.emitAsync(
      'hook:subscriber:assign',
      {
        assignedTo: updated.assignedTo,
        assignedAt: updated.assignedAt,
      },
      profile,
    );

    this.logger.debug(
      `Subscriber "${profile.id}" handed over to "${assignTo}"`,
    );

    return updated;
  }

  /**
   * Hand back (unassign) the subscriber from the current assignee.
   *
   * @param profile - The end-user (subscriber) profile
   * @returns The updated profile with assignee fields cleared
   */
  async handBack(profile: Subscriber): Promise<Subscriber> {
    const updated = await this.updateOne(profile.id, {
      assignedTo: null,
      assignedAt: null,
    });

    await this.eventEmitter.emitAsync(
      'hook:subscriber:assign',
      {
        assignedTo: null,
        assignedAt: null,
      },
      profile,
    );

    this.logger.debug(`Subscriber "${profile.id}" handed back`);

    return updated;
  }

  /**
   * Resolves the least-loaded online active assignee.
   */
  private async resolveAutoAssigneeId(): Promise<string | null> {
    const onlineUserIds =
      this.websocketGateway?.getConnectedAuthenticatedUserIds() ?? [];

    if (!onlineUserIds.length) {
      return null;
    }

    const activeUserIds =
      await this.userService.findActiveUserIds(onlineUserIds);
    if (!activeUserIds.length) {
      return null;
    }

    const workloadByUser =
      await this.repository.countAssignedSubscribersByUserIds(activeUserIds);
    const sortedCandidates = [...activeUserIds].sort((a, b) => {
      const aCount = workloadByUser[a] ?? 0;
      const bCount = workloadByUser[b] ?? 0;

      if (aCount !== bCount) {
        return aCount - bCount;
      }

      return a.localeCompare(b);
    });

    return sortedCandidates[0] ?? null;
  }

  /**
   * Performs policy-based subscriber handover for conversational workflows.
   */
  async handOverByPolicy(
    profile: Subscriber,
    input: SubscriberHandoverPolicyInput,
  ): Promise<SubscriberHandoverPolicyResult> {
    if (input.mode === 'specific') {
      if (!input.userId) {
        throw new Error('`userId` is required when handover mode is specific');
      }

      const [activeUserId] = await this.userService.findActiveUserIds([
        input.userId,
      ]);
      const isActive = activeUserId === input.userId;
      if (!isActive) {
        throw new Error(
          `Unable to handover to user "${input.userId}": user is inactive or does not exist`,
        );
      }

      const updated = await this.handOver(profile, input.userId);

      return {
        success: true,
        mode: 'specific',
        subscriber: updated,
        assignedTo: updated.assignedTo,
      };
    }

    const assigneeId = await this.resolveAutoAssigneeId();
    if (!assigneeId) {
      return {
        success: false,
        mode: 'auto',
        subscriber: profile,
        assignedTo: profile.assignedTo ?? null,
        reason: 'no_available_user',
      };
    }

    const updated = await this.handOver(profile, assigneeId);

    return {
      success: true,
      mode: 'auto',
      subscriber: updated,
      assignedTo: updated.assignedTo,
    };
  }

  /**
   * Apply updates on end-user such as :
   * - Assign labels to specific end-user
   * - Handover discussion to human
   *
   * @deprecated
   * @param profile - The end-user (subscriber) profile
   * @param labels - Array of label ids that represent new labels to assign to end-user
   * @param assignTo - User ID to handover the discussion to
   *
   * @returns The updated profile
   */
  async applyUpdates(
    profile: Subscriber,
    labels: string[],
    assignTo: string | null,
  ) {
    try {
      let current = profile;

      // 1) Apply labels update (no-op if labels is empty)
      if (labels.length > 0) {
        current = await this.assignLabels(current, labels);
      }

      // 2) Apply handover (no-op if assignTo is null)
      if (assignTo) {
        current = await this.handOver(current, assignTo);
      }

      this.logger.debug('Subscriber updates have been applied!', {
        labels,
        assignTo,
      });

      return current;
    } catch (err) {
      this.logger.error('Unable to perform subscriber updates!', err);
      throw err;
    }
  }

  /**
   * Updates the `lastvisit` and `retainedFrom` fields of a subscriber when a new message is received.
   *
   * This method checks if the subscriber has a `lastvisit` field, and if so, it attempts to update the subscriber's
   * information. Specifically, it resets the `retainedFrom` field if the subscriber has not been active for a
   * configured period of time (`retentionReset` threshold). The `lastvisit` field is always updated to the current time.
   *
   * If the update is successful, it logs the updated user's information.
   *
   * @param subscriber The subscriber whose is being handled.
   */
  @OnEvent('hook:user:lastvisit')
  async handleLastVisit(subscriber: Subscriber) {
    if (subscriber.lastvisit) {
      try {
        const user = await this.updateOne(subscriber.id, {
          // Retentioned user is lost if not chating for a giving duration
          // at a first time if a user passes a day without chating we reset
          retainedFrom:
            +new Date() - +subscriber.lastvisit >
            config.analytics.thresholds.retentionReset
              ? new Date()
              : subscriber.retainedFrom,
          lastvisit: new Date(),
        });
        this.logger.debug(
          'lastVisit Hook : user retainedFrom/lastvisit updated !',
          JSON.stringify(user),
        );
      } catch (err) {
        this.logger.error('Unable to log user last visit', err);
      }
    }
  }
}
