/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  OutgoingMessageType,
  StdOutgoingMessageEnvelope,
} from '@hexabot-ai/types';

export class UnsupportedOutgoingFormatError extends Error {
  constructor(
    public readonly type: string,
    message = `Unsupported outgoing message type "${type}".`,
  ) {
    super(message);
    this.name = 'UnsupportedOutgoingFormatError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export type EnvelopeHandlers<Out, Opt = unknown> = {
  [OutgoingMessageType.text]: (
    envelope: Extract<
      StdOutgoingMessageEnvelope,
      { type: OutgoingMessageType.text }
    >,
    options: Opt,
  ) => Promise<Out> | Out;
  [OutgoingMessageType.quickReply]: (
    envelope: Extract<
      StdOutgoingMessageEnvelope,
      { type: OutgoingMessageType.quickReply }
    >,
    options: Opt,
  ) => Promise<Out> | Out;
  [OutgoingMessageType.buttons]: (
    envelope: Extract<
      StdOutgoingMessageEnvelope,
      { type: OutgoingMessageType.buttons }
    >,
    options: Opt,
  ) => Promise<Out> | Out;
  [OutgoingMessageType.attachment]: (
    envelope: Extract<
      StdOutgoingMessageEnvelope,
      { type: OutgoingMessageType.attachment }
    >,
    options: Opt,
  ) => Promise<Out> | Out;
  [OutgoingMessageType.list]: (
    envelope: Extract<
      StdOutgoingMessageEnvelope,
      { type: OutgoingMessageType.list }
    >,
    options: Opt,
  ) => Promise<Out> | Out;
  [OutgoingMessageType.carousel]: (
    envelope: Extract<
      StdOutgoingMessageEnvelope,
      { type: OutgoingMessageType.carousel }
    >,
    options: Opt,
  ) => Promise<Out> | Out;
};

export abstract class ChannelOutboundMessageEncoder<Out, Opt = unknown> {
  abstract encode(
    envelope: StdOutgoingMessageEnvelope,
    options: Opt,
  ): Promise<Out> | Out;

  protected dispatchEnvelope(
    envelope: StdOutgoingMessageEnvelope,
    options: Opt,
    handlers: EnvelopeHandlers<Out, Opt>,
  ): Promise<Out> | Out {
    switch (envelope.type) {
      case OutgoingMessageType.text:
        return handlers[OutgoingMessageType.text](envelope, options);
      case OutgoingMessageType.quickReply:
        return handlers[OutgoingMessageType.quickReply](envelope, options);
      case OutgoingMessageType.buttons:
        return handlers[OutgoingMessageType.buttons](envelope, options);
      case OutgoingMessageType.attachment:
        return handlers[OutgoingMessageType.attachment](envelope, options);
      case OutgoingMessageType.list:
        return handlers[OutgoingMessageType.list](envelope, options);
      case OutgoingMessageType.carousel:
        return handlers[OutgoingMessageType.carousel](envelope, options);
      default:
        return this.assertNeverOutgoingEnvelope(envelope);
    }
  }

  protected assertNeverOutgoingEnvelope(value: never): never {
    const unknownType =
      typeof value === 'object' && value && 'type' in value
        ? String((value as { type: unknown }).type)
        : 'unknown';

    throw new UnsupportedOutgoingFormatError(unknownType);
  }
}
