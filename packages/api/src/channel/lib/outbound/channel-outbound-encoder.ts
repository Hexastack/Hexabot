/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  OutgoingMessageFormat,
  StdOutgoingMessageEnvelope,
} from '@hexabot-ai/types';

export class UnsupportedOutgoingFormatError extends Error {
  constructor(
    public readonly format: string,
    message = `Unsupported outgoing message format "${format}".`,
  ) {
    super(message);
    this.name = 'UnsupportedOutgoingFormatError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export type EnvelopeHandlers<Out, Opt = unknown> = {
  [OutgoingMessageFormat.text]: (
    envelope: Extract<
      StdOutgoingMessageEnvelope,
      { format: OutgoingMessageFormat.text }
    >,
    options: Opt,
  ) => Promise<Out> | Out;
  [OutgoingMessageFormat.quickReplies]: (
    envelope: Extract<
      StdOutgoingMessageEnvelope,
      { format: OutgoingMessageFormat.quickReplies }
    >,
    options: Opt,
  ) => Promise<Out> | Out;
  [OutgoingMessageFormat.buttons]: (
    envelope: Extract<
      StdOutgoingMessageEnvelope,
      { format: OutgoingMessageFormat.buttons }
    >,
    options: Opt,
  ) => Promise<Out> | Out;
  [OutgoingMessageFormat.attachment]: (
    envelope: Extract<
      StdOutgoingMessageEnvelope,
      { format: OutgoingMessageFormat.attachment }
    >,
    options: Opt,
  ) => Promise<Out> | Out;
  [OutgoingMessageFormat.list]: (
    envelope: Extract<
      StdOutgoingMessageEnvelope,
      { format: OutgoingMessageFormat.list }
    >,
    options: Opt,
  ) => Promise<Out> | Out;
  [OutgoingMessageFormat.carousel]: (
    envelope: Extract<
      StdOutgoingMessageEnvelope,
      { format: OutgoingMessageFormat.carousel }
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
    switch (envelope.format) {
      case OutgoingMessageFormat.text:
        return handlers[OutgoingMessageFormat.text](envelope, options);
      case OutgoingMessageFormat.quickReplies:
        return handlers[OutgoingMessageFormat.quickReplies](envelope, options);
      case OutgoingMessageFormat.buttons:
        return handlers[OutgoingMessageFormat.buttons](envelope, options);
      case OutgoingMessageFormat.attachment:
        return handlers[OutgoingMessageFormat.attachment](envelope, options);
      case OutgoingMessageFormat.list:
        return handlers[OutgoingMessageFormat.list](envelope, options);
      case OutgoingMessageFormat.carousel:
        return handlers[OutgoingMessageFormat.carousel](envelope, options);
      default:
        return this.assertNeverOutgoingEnvelope(envelope);
    }
  }

  protected assertNeverOutgoingEnvelope(value: never): never {
    const unknownFormat =
      typeof value === 'object' && value && 'format' in value
        ? String((value as { format: unknown }).format)
        : 'unknown';

    throw new UnsupportedOutgoingFormatError(unknownFormat);
  }
}
