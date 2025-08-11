/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import mime from 'mime';
import { v4 as uuidv4 } from 'uuid';

import { AttachmentService } from '@/attachment/services/attachment.service';
import {
  AttachmentAccess,
  AttachmentCreatedByRef,
  AttachmentFile,
  AttachmentResourceRef,
} from '@/attachment/types';
import { config } from '@/config';
import { BaseService } from '@/utils/generics/base-service';
import { TFilterQuery } from '@/utils/types/filter.types';
import {
  SocketGet,
  SocketPost,
} from '@/websocket/decorators/socket-method.decorator';
import { SocketReq } from '@/websocket/decorators/socket-req.decorator';
import { SocketRes } from '@/websocket/decorators/socket-res.decorator';
import { IOOutgoingSubscribeMessage } from '@/websocket/pipes/io-message.pipe';
import { Room } from '@/websocket/types';
import { SocketRequest } from '@/websocket/utils/socket-request';
import { SocketResponse } from '@/websocket/utils/socket-response';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import { SubscriberDto, SubscriberUpdateDto } from '../dto/subscriber.dto';
import { SubscriberRepository } from '../repositories/subscriber.repository';
import { Label } from '../schemas/label.schema';
import {
  Subscriber,
  SubscriberFull,
  SubscriberPopulate,
} from '../schemas/subscriber.schema';

import { LabelService } from './label.service';

@Injectable()
export class SubscriberService extends BaseService<
  Subscriber,
  SubscriberPopulate,
  SubscriberFull,
  SubscriberDto
> {
  constructor(
    readonly repository: SubscriberRepository,
    protected readonly attachmentService: AttachmentService,
    protected readonly labelService: LabelService,
    private readonly gateway: WebsocketGateway,
  ) {
    super(repository);
  }

  /**
   * Internally subscribe web-sockets to user's event
   * For example : Notify chat if new user interacted with the chatbot
   *
   * @param req - The socket request object
   * @param res - The socket response object
   */
  @SocketGet('/subscriber/subscribe/')
  @SocketPost('/subscriber/subscribe/')
  async subscribe(
    @SocketReq() req: SocketRequest,
    @SocketRes() res: SocketResponse,
  ): Promise<IOOutgoingSubscribeMessage> {
    try {
      await this.gateway.joinNotificationSockets(req, Room.SUBSCRIBER);

      return res.status(200).json({
        success: true,
        subscribe: Room.SUBSCRIBER,
      });
    } catch (e) {
      this.logger.error('Websocket subscription');
      throw new InternalServerErrorException(e);
    }
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

    let labelsToPull: string[] = [];
    if (subscriber.labels.length > 0) {
      const [newMutexLabels, existingMutexLabels] = [
        // Retrieve new mutex group labels (if any)
        await this.labelService.find({
          _id: { $in: labelsToPush },
          group: { $ne: null },
        }),
        // Retrieve existing mutex group labels (if any)
        await this.labelService.find({
          _id: { $in: subscriber.labels },
          group: { $ne: null },
        }),
      ];

      if (newMutexLabels.length > 0 && existingMutexLabels.length > 0) {
        const mutexGroups = newMutexLabels
          .map(({ group }) => group)
          .filter((group): group is string => !!group);

        labelsToPull = existingMutexLabels
          .filter(({ group }) => group && mutexGroups.includes(group))
          .map(({ id }) => id);
      }
    }

    return await this.repository.updateLabels(
      subscriber.id,
      labelsToPush,
      labelsToPull,
    );
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

    const updated = await this.updateOne(profile.id, { assignedTo: assignTo });
    this.logger.debug(
      `Subscriber "${profile.id}" handed over to "${assignTo}"`,
    );
    return updated;
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

      this.logger.debug('Block updates have been applied!', {
        labels,
        assignTo,
      });
      return current;
    } catch (err) {
      this.logger.error('Unable to perform block updates!', err);
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
        this.logger.error(err);
      }
    }
  }

  /**
   * Before deleting a `Label`, this method updates the `labels` field of a subscriber.
   *
   * @param _query - The Mongoose query object used for deletion.
   * @param criteria - The filter criteria for finding the labels to be deleted.
   */
  @OnEvent('hook:label:preDelete')
  async handleLabelDelete(
    _query: unknown,
    criteria: TFilterQuery<Label>,
  ): Promise<void> {
    if (criteria._id) {
      await this.getRepository().model.updateMany(
        { labels: criteria._id },
        { $pull: { labels: criteria._id } },
      );
    } else {
      throw new Error('Attempted to delete label using unknown criteria');
    }
  }
}
