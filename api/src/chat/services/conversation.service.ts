/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable, Logger } from '@nestjs/common';

import EventWrapper from '@/channel/lib/EventWrapper';
import { ChannelName } from '@/channel/types';
import { LoggerService } from '@/logger/logger.service';
import { BaseService } from '@/utils/generics/base-service';

import { VIEW_MORE_PAYLOAD } from '../helpers/constants';
import { ConversationRepository } from '../repositories/conversation.repository';
import { Block, BlockFull } from '../schemas/block.schema';
import {
  Conversation,
  ConversationFull,
  ConversationPopulate,
} from '../schemas/conversation.schema';
import { OutgoingMessageFormat } from '../schemas/types/message';
import { Payload } from '../schemas/types/quick-reply';

import { ContextVarService } from './context-var.service';
import { SubscriberService } from './subscriber.service';

@Injectable()
export class ConversationService extends BaseService<
  Conversation,
  ConversationPopulate,
  ConversationFull
> {
  constructor(
    readonly repository: ConversationRepository,
    private readonly logger: LoggerService,
    private readonly contextVarService: ContextVarService,
    private readonly subscriberService: SubscriberService,
  ) {
    super(repository);
  }

  /**
   * Marks the conversation as inactive.
   *
   * @param convo - The conversation
   */
  async end(convo: Conversation | ConversationFull) {
    return await this.repository.end(convo);
  }

  /**
   * Saves the actual conversation context and returns the updated conversation
   *
   * @param convo - The Current Conversation
   * @param next - The next block to be triggered
   * @param event - The event received
   * @param captureVars - If we should capture vars or not
   *
   * @returns The updated conversation
   */
  async storeContextData(
    convo: Conversation | ConversationFull,
    next: Block | BlockFull,
    event: EventWrapper<any, any>,
    captureVars: boolean = false,
  ) {
    const msgType = event.getMessageType();
    const profile = event.getSender();
    // Capture channel specific context data
    convo.context.channel = event.getHandler().getName() as ChannelName;
    convo.context.text = event.getText();
    convo.context.payload = event.getPayload();
    convo.context.nlp = event.getNLP();
    convo.context.vars = convo.context.vars || {};

    const contextVars =
      await this.contextVarService.getContextVarsByBlock(next);

    // Capture user entry in context vars
    if (captureVars && next.capture_vars && next.capture_vars.length > 0) {
      next.capture_vars.forEach((capture) => {
        let contextValue: string | Payload;

        const nlp = event.getNLP();

        if (nlp && nlp.entities && nlp.entities.length) {
          const nlpIndex = nlp.entities
            .map((n) => {
              return n.entity;
            })
            .indexOf(capture.entity.toString());
          if (capture.entity && nlpIndex !== -1) {
            // Get the most confident value
            contextValue = nlp.entities[nlpIndex].value;
            // .reduce((prev, current) => {
            //   return (prev.confidence > current.confidence) ? prev : current;
            // }, {value: '', confidence: 0}).value;
          }
        }

        if (capture.entity === -1) {
          // Capture the whole message
          contextValue =
            ['message', 'quick_reply'].indexOf(msgType) !== -1
              ? event.getText()
              : event.getPayload();
        } else if (capture.entity === -2) {
          // Capture the postback payload (button click)
          contextValue = event.getPayload();
        }
        contextValue =
          typeof contextValue === 'string' ? contextValue.trim() : contextValue;

        if (contextVars[capture.context_var]?.permanent) {
          Logger.debug(
            `Adding context var to subscriber: ${capture.context_var} = ${contextValue}`,
          );
          profile.context.vars[capture.context_var] = contextValue;
        } else {
          convo.context.vars[capture.context_var] = contextValue;
        }
      });
    }

    // Store user infos
    if (profile) {
      // @ts-expect-error : id needs to remain readonly
      convo.context.user.id = profile.id;
      convo.context.user.first_name = profile.first_name || '';
      convo.context.user.last_name = profile.last_name || '';
      if (profile.language) {
        convo.context.user.language = profile.language;
      }
    }

    // Handle attachments (location, ...)
    if (msgType === 'location') {
      const coordinates = event.getMessage().coordinates;
      convo.context.user_location = { lat: 0, lon: 0 };
      convo.context.user_location.lat = parseFloat(coordinates.lat);
      convo.context.user_location.lon = parseFloat(coordinates.lon);
    } else if (msgType === 'attachments') {
      // @TODO : deprecated in favor of geolocation msgType
      const attachments = event.getAttachments();
      // @ts-expect-error deprecated
      if (attachments.length === 1 && attachments[0].type === 'location') {
        // @ts-expect-error deprecated
        const coord = attachments[0].payload.coordinates;
        convo.context.user_location = { lat: 0, lon: 0 };
        convo.context.user_location.lat = parseFloat(coord.lat);
        convo.context.user_location.lon = parseFloat(coord.long);
      }
    }

    // Deal with load more in the case of a list display
    if (
      next.options.content &&
      (next.options.content.display === OutgoingMessageFormat.list ||
        next.options.content.display === OutgoingMessageFormat.carousel)
    ) {
      if (event.getPayload() === VIEW_MORE_PAYLOAD) {
        convo.context.skip[next.id] += next.options.content.limit;
      } else {
        convo.context.skip = convo.context.skip ? convo.context.skip : {};
        convo.context.skip[next.id] = 0;
      }
    }
    // Execute additional logic provided by plugins on the context
    // @todo : uncomment once plugin module is tested
    // sails.plugins.applyEffect('onStoreContextData', next.options.effects || [], [convo, next, event, captureVars]);
    // Store new context data
    try {
      const updatedConversation = await this.updateOne(convo.id, {
        context: convo.context,
      });
      if (!updatedConversation) {
        throw new Error(
          'Conversation Model : No conversation has been updated',
        );
      }

      //TODO: add check if nothing changed don't update

      await this.subscriberService.updateOne(convo.sender, {
        context: profile.context,
      });

      return updatedConversation;
    } catch (err) {
      this.logger.error('Conversation Model : Unable to store context', err);
      throw err;
    }
  }
}
