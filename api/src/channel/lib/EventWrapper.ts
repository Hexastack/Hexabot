/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Attachment } from '@/attachment/schemas/attachment.schema';
import { Subscriber } from '@/chat/schemas/subscriber.schema';
import { SubscriberChannelData } from '@/chat/schemas/types/channel';
import {
  IncomingMessageType,
  StdEventType,
  StdIncomingMessage,
} from '@/chat/schemas/types/message';
import { Payload } from '@/chat/schemas/types/quick-reply';
import { NLU } from '@/helper/types';

import { ChannelName } from '../types';

import ChannelHandler from './Handler';

export interface ChannelEvent {}

// eslint-disable-next-line prettier/prettier
export default abstract class EventWrapper<
  A extends {
    eventType: StdEventType;
    messageType?: IncomingMessageType;
    raw: E;
    attachments?: Attachment[];
  },
  E,
  N extends ChannelName = ChannelName,
  C extends ChannelHandler = ChannelHandler<N>,
  S = SubscriberChannelDict[N],
> {
  _adapter: A = {
    raw: {},
    eventType: StdEventType.unknown,
    attachments: undefined,
  } as A;

  _handler: C;

  channelAttrs: S;

  subscriber!: Subscriber;

  _nlp!: NLU.ParseEntities;

  /**
   * Constructor : Class used to wrap any channel's event in order
   * to provide a unified interface for accessing data by the chatbot.
   *
   * Any method declared in this class should be extended and overridden in any given channel's
   * event wrapper if needed.
   * @param handler - The channel's handler
   * @param event - The message event received
   * @param channelAttrs - Channel's specific data
   */
  constructor(handler: C, event: A['raw'], channelAttrs: S = {} as S) {
    this._handler = handler;
    this._init(event);
    this.channelAttrs = channelAttrs;
  }

  toString() {
    return JSON.stringify(
      {
        handler: this._handler.getName(),
        channelData: this.getChannelData(),
        sender: this.getSender(),
        // recipient: this.getRecipientForeignId(),
        eventType: this.getEventType(),
        messageType: this.getMessageType(),
        payload: this.getPayload(),
        message: this.getMessage(),
        deliveredMessages: this.getDeliveredMessages(),
        watermark: this.getWatermark(),
      },
      null,
      4,
    );
  }

  /**
   * Called by the parent constructor, it defines `_adapter` which should store :
   *
   * - `_adapter.eventType` : The type of event received
   *
   *- `_adapter.messageType` : The type of message when the event is a message.
   *
   *- `_adapter.raw` : Sets a typed object of the event raw data
   * @param event - The message event received from a given channel
   */
  abstract _init(event: A['raw']): void;

  /**
   * Retrieves the current channel handler.
   *
   * @returns The current instance of the channel handler.
   */
  getHandler(): C {
    return this._handler;
  }

  /**
   * Retrieves channel data.
   *
   * @returns Returns any channel related data.
   */
  getChannelData(): SubscriberChannelData<N> {
    return {
      name: this._handler.getName(),
      ...this.channelAttrs,
    } as SubscriberChannelData<N>;
  }

  /**
   * Returns the message id.
   * @returns the message id.
   */
  abstract getId(): string;

  /**
   * Sets an event attribute value
   *
   * @deprecated
   * @param attr - Event attribute name
   * @param value - The value to set for the specified attribute.
   */
  set(attr: string, value: any) {
    (this._adapter as any).raw[attr] = value;
  }

  /**
   * Returns an event attribute value, default value if it does exist
   *
   * @deprecated
   * @param  attr - Event attribute name
   * @param  otherwise - Default value if attribute does not exist
   *
   * @returns The value of the specified attribute or the default value.
   */
  get(attr: string, otherwise: any): any {
    return attr in (this._adapter as any).raw
      ? ((this._adapter as any).raw as any)[attr]
      : otherwise || {};
  }

  /**
   * Returns attached NLP parse results
   *
   * @returns The parsed NLP entities, or null if not available.
   */
  getNLP(): NLU.ParseEntities | null {
    return this._nlp;
  }

  /**
   * Attaches the NLP object to the event
   *
   * @param nlp - NLP parse results
   */
  setNLP(nlp: NLU.ParseEntities) {
    this._nlp = nlp;
  }

  /**
   * Returns event sender/profile id (channel's id)
   *
   * @returns sender/profile id
   */
  abstract getSenderForeignId(): string;

  /**
   * Returns event sender data
   *
   * @returns event sender data
   */
  getSender(): Subscriber {
    return this.subscriber;
  }

  /**
   * Sets event sender data
   *
   * @param profile - Sender data
   */
  setSender(profile: Subscriber) {
    this.subscriber = profile;
  }

  /**
   * Pre-Process the message event
   *
   * Child class can perform operations such as storing files as attachments.
   */
  async preprocess() {
    if (
      this._adapter.eventType === StdEventType.message &&
      this._adapter.messageType === IncomingMessageType.attachments
    ) {
      await this._handler.persistMessageAttachments(
        this as EventWrapper<
          any,
          any,
          ChannelName,
          ChannelHandler<ChannelName>,
          Record<string, any>
        >,
      );
    }
  }

  /**
   * Returns event recipient id
   *
   * @returns event recipient id
   */
  abstract getRecipientForeignId(): string;

  /**
   * Returns the type of event received (message, delivery, read, ...)
   *
   * @returns The type of event received (message, delivery, read, ...)
   */
  getEventType(): StdEventType {
    return this._adapter.eventType;
  }

  /**
   * Identifies the type of the message received
   *
   * @return The type of message
   */
  getMessageType(): IncomingMessageType | undefined {
    return this._adapter.messageType;
  }

  /**
   * Return payload whenever user clicks on a button/quick_reply or sends an attachment, false otherwise
   *
   * @returns The payload content
   */
  abstract getPayload(): Payload | string | undefined;

  /**
   * Returns the message in a standardized format
   *
   * @returns The received message
   */
  abstract getMessage(): StdIncomingMessage;

  /**
   * Return the text message received
   *
   * @returns Received text message
   */
  getText(): string {
    const message = this.getMessage();
    if ('text' in message) {
      return message.text;
    } else if ('serialized_text' in message) {
      return message.serialized_text;
    }
    return '';
  }

  /**
   * Returns the list of delivered messages
   *
   * @returns Array of message ids
   */
  abstract getDeliveredMessages(): string[];

  /**
   * Returns the message's watermark
   *
   * @returns The message's watermark
   */
  abstract getWatermark(): number;
}

type GenericEvent = { senderId: string; messageId: string };
type GenericEventAdapter = {
  eventType: StdEventType.unknown;
  messageType: IncomingMessageType.unknown;
  raw: GenericEvent;
};

export class GenericEventWrapper extends EventWrapper<
  GenericEventAdapter,
  GenericEvent,
  ChannelName
> {
  /**
   * Constructor : channel's event wrapper
   *
   * @param  handler - The channel's handler
   * @param event - The message event received
   */
  constructor(handler: ChannelHandler, event: GenericEvent) {
    super(handler, event);
  }

  /**
   * Called by the parent constructor, it defines :
   * 
   *     - The type of event received
   * 
   *     - The type of message when the event is a message.
   * 
   *     - Sets a typed raw object of the event data
   * @param event - The message event received

   */
  _init(event: GenericEvent): void {
    this._adapter.eventType = StdEventType.unknown;
    this._adapter.messageType = IncomingMessageType.unknown;
    this._adapter.raw = event;
  }

  /**
   * Returns the message id
   *
   * @returns The message id
   */
  getId(): string {
    if (this._adapter.raw.messageId) {
      return this._adapter.raw.messageId;
    }
    throw new Error('The message id `mid` is missing');
  }

  /**
   * Returns event sender id
   *
   * @returns event sender id
   */
  getSenderForeignId(): string {
    if (this._adapter.raw.senderId) {
      return this._adapter.raw.senderId;
    }
    throw new Error('The sender id is missing');
  }

  /**
   * Returns event recipient id (channel's id)
   *
   * @returns Returns event recipient id
   */
  getRecipientForeignId(): string {
    throw new Error('The recipient id is missing');
  }

  /**
   * Returns the type of event received
   *
   * @returns The type of event received
   */
  getEventType(): StdEventType {
    return this._adapter.eventType;
  }

  /**
   * Finds out and returns the type of the event received from the channel
   *
   * @returns The type of message
   */
  getMessageType(): IncomingMessageType {
    return this._adapter.messageType;
  }

  /**
   * Returns payload whenever user clicks on a button/quick_reply or sends an attachment
   *
   * @returns The payload content
   */
  getPayload(): Payload | string | undefined {
    return undefined;
  }

  /**
   * Returns a standard message format that can be stored in DB
   *
   * @returns Received message in standard format
   */
  getMessage(): StdIncomingMessage {
    throw new Error('Unknown incoming message type');
  }

  /**
   * Returns the delivered messages ids
   *
   * @returns return delivered messages ids
   */
  getDeliveredMessages(): string[] {
    return [];
  }

  /**
   * Returns the message's watermark (timestamp or equivalent).
   *
   * @returns The message's watermark
   */
  getWatermark() {
    return 0;
  }
}
