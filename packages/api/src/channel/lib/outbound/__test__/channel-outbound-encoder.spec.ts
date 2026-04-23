/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  OutgoingMessageFormat,
  StdOutgoingMessageEnvelope,
} from '@hexabot-ai/types';

import {
  attachmentMessage,
  buttonsMessage,
  contentMessage,
  quickRepliesMessage,
  textMessage,
} from '@/channel/lib/__test__/common.mock';

import {
  ChannelOutboundMessageEncoder,
  EnvelopeHandlers,
  UnsupportedOutgoingFormatError,
} from '../channel-outbound-encoder';

class TestChannelOutboundEncoder extends ChannelOutboundMessageEncoder<
  string,
  void
> {
  encode(): string {
    throw new Error('Not implemented for this test');
  }

  public dispatch(
    envelope: StdOutgoingMessageEnvelope,
    handlers: EnvelopeHandlers<string, void>,
  ) {
    return this.dispatchEnvelope(envelope, undefined, handlers);
  }
}

describe('channel outbound encoder helpers', () => {
  const encoder = new TestChannelOutboundEncoder();

  it('dispatches each outgoing message envelope format', () => {
    const handlers: EnvelopeHandlers<string, void> = {
      [OutgoingMessageFormat.text]: () => OutgoingMessageFormat.text,
      [OutgoingMessageFormat.quickReplies]: () =>
        OutgoingMessageFormat.quickReplies,
      [OutgoingMessageFormat.buttons]: () => OutgoingMessageFormat.buttons,
      [OutgoingMessageFormat.attachment]: () =>
        OutgoingMessageFormat.attachment,
      [OutgoingMessageFormat.list]: () => OutgoingMessageFormat.list,
      [OutgoingMessageFormat.carousel]: () => OutgoingMessageFormat.carousel,
    };

    expect(
      encoder.dispatch(
        {
          format: OutgoingMessageFormat.text,
          data: textMessage,
        },
        handlers,
      ),
    ).toEqual(OutgoingMessageFormat.text);
    expect(
      encoder.dispatch(
        {
          format: OutgoingMessageFormat.quickReplies,
          data: quickRepliesMessage,
        },
        handlers,
      ),
    ).toEqual(OutgoingMessageFormat.quickReplies);
    expect(
      encoder.dispatch(
        {
          format: OutgoingMessageFormat.buttons,
          data: buttonsMessage,
        },
        handlers,
      ),
    ).toEqual(OutgoingMessageFormat.buttons);
    expect(
      encoder.dispatch(
        {
          format: OutgoingMessageFormat.attachment,
          data: attachmentMessage,
        },
        handlers,
      ),
    ).toEqual(OutgoingMessageFormat.attachment);
    expect(
      encoder.dispatch(
        {
          format: OutgoingMessageFormat.list,
          data: contentMessage,
        },
        handlers,
      ),
    ).toEqual(OutgoingMessageFormat.list);
    expect(
      encoder.dispatch(
        {
          format: OutgoingMessageFormat.carousel,
          data: contentMessage,
        },
        handlers,
      ),
    ).toEqual(OutgoingMessageFormat.carousel);
  });

  it('throws explicit error when dispatch receives unsupported format', () => {
    const handlers: EnvelopeHandlers<string, void> = {
      [OutgoingMessageFormat.text]: () => OutgoingMessageFormat.text,
      [OutgoingMessageFormat.quickReplies]: () =>
        OutgoingMessageFormat.quickReplies,
      [OutgoingMessageFormat.buttons]: () => OutgoingMessageFormat.buttons,
      [OutgoingMessageFormat.attachment]: () =>
        OutgoingMessageFormat.attachment,
      [OutgoingMessageFormat.list]: () => OutgoingMessageFormat.list,
      [OutgoingMessageFormat.carousel]: () => OutgoingMessageFormat.carousel,
    };

    expect(() =>
      encoder.dispatch(
        {
          format: 'unknown',
          data: textMessage,
        } as any,
        handlers as any,
      ),
    ).toThrow(UnsupportedOutgoingFormatError);
  });
});
