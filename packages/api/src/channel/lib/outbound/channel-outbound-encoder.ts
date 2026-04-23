/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  OutgoingMessageFormat,
  StdOutgoingAttachmentEnvelope,
  StdOutgoingButtonsEnvelope,
  StdOutgoingListEnvelope,
  StdOutgoingMessage,
  StdOutgoingMessageEnvelope,
  StdOutgoingQuickRepliesEnvelope,
  StdOutgoingTextEnvelope,
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
    envelope: StdOutgoingTextEnvelope,
    options: Opt,
  ) => Promise<Out> | Out;
  [OutgoingMessageFormat.quickReplies]: (
    envelope: StdOutgoingQuickRepliesEnvelope,
    options: Opt,
  ) => Promise<Out> | Out;
  [OutgoingMessageFormat.buttons]: (
    envelope: StdOutgoingButtonsEnvelope,
    options: Opt,
  ) => Promise<Out> | Out;
  [OutgoingMessageFormat.attachment]: (
    envelope: StdOutgoingAttachmentEnvelope,
    options: Opt,
  ) => Promise<Out> | Out;
  [OutgoingMessageFormat.list]: (
    envelope: StdOutgoingListEnvelope,
    options: Opt,
  ) => Promise<Out> | Out;
  [OutgoingMessageFormat.carousel]: (
    envelope: StdOutgoingListEnvelope,
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

export function inferOutgoingMessageEnvelope(
  message: StdOutgoingMessage,
): StdOutgoingMessageEnvelope {
  if ('buttons' in message) {
    return {
      format: OutgoingMessageFormat.buttons,
      message,
    };
  }

  if ('attachment' in message) {
    return {
      format: OutgoingMessageFormat.attachment,
      message,
    };
  }

  if ('quickReplies' in message) {
    return {
      format: OutgoingMessageFormat.quickReplies,
      message,
    };
  }

  if ('options' in message) {
    return {
      format:
        message.options.display === OutgoingMessageFormat.carousel
          ? OutgoingMessageFormat.carousel
          : OutgoingMessageFormat.list,
      message,
    };
  }

  if ('text' in message) {
    return {
      format: OutgoingMessageFormat.text,
      message,
    };
  }

  throw new UnsupportedOutgoingFormatError(
    'unknown',
    'Unable to infer outgoing message format from message payload.',
  );
}
