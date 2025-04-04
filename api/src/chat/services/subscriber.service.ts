/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  Injectable,
  InternalServerErrorException,
  Optional,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { AttachmentService } from '@/attachment/services/attachment.service';
import { config } from '@/config';
import { BaseService } from '@/utils/generics/base-service';
import {
  SocketGet,
  SocketPost,
} from '@/websocket/decorators/socket-method.decorator';
import { SocketReq } from '@/websocket/decorators/socket-req.decorator';
import { SocketRes } from '@/websocket/decorators/socket-res.decorator';
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

@Injectable()
export class SubscriberService extends BaseService<
  Subscriber,
  SubscriberPopulate,
  SubscriberFull,
  SubscriberDto
> {
  private readonly gateway: WebsocketGateway;

  constructor(
    readonly repository: SubscriberRepository,
    protected attachmentService: AttachmentService,
    @Optional() gateway?: WebsocketGateway,
  ) {
    super(repository);
    if (gateway) this.gateway = gateway;
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
  subscribe(@SocketReq() req: SocketRequest, @SocketRes() res: SocketResponse) {
    try {
      this.gateway.io.socketsJoin(Room.SUBSCRIBER);
      return res.json({
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
   * Apply updates on end-user such as :
   * - Assign labels to specific end-user
   * - Handover discussion to human
   *
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
      const updates: SubscriberUpdateDto = {};
      if (labels.length > 0) {
        let userLabels = profile.labels ? profile.labels : [];
        // Filter unique
        userLabels = [...new Set(userLabels.concat(labels))];
        updates.labels = userLabels;
      }

      if (assignTo) {
        updates.assignedTo = assignTo;
      }

      const updated = await this.updateOne(profile.id, updates);
      this.logger.debug('Block updates has been applied!', updates);
      return updated;
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
   * Updates the `labels` field of a subscriber when a label is deleted.
   *
   * This method removes the deleted label from the `labels` field of all subscribers that have the label.
   *
   * @param label The label that is being deleted.
   */
  @OnEvent('hook:label:delete')
  async handleLabelDelete(labels: Label[]) {
    const subscribers = await this.find({
      labels: { $in: labels.map((l) => l.id) },
    });
    for (const subscriber of subscribers) {
      const updatedLabels = subscriber.labels.filter(
        (label) => !labels.find((l) => l.id === label),
      );
      await this.updateOne(subscriber.id, { labels: updatedLabels });
    }
  }
}
