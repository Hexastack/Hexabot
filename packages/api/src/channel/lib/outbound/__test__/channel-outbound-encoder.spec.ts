/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  OutgoingMessageType,
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
      [OutgoingMessageType.text]: () => OutgoingMessageType.text,
      [OutgoingMessageType.quickReply]: () => OutgoingMessageType.quickReply,
      [OutgoingMessageType.buttons]: () => OutgoingMessageType.buttons,
      [OutgoingMessageType.attachment]: () => OutgoingMessageType.attachment,
      [OutgoingMessageType.list]: () => OutgoingMessageType.list,
      [OutgoingMessageType.carousel]: () => OutgoingMessageType.carousel,
    };

    expect(
      encoder.dispatch(
        {
          type: OutgoingMessageType.text,
          data: textMessage,
        },
        handlers,
      ),
    ).toEqual(OutgoingMessageType.text);
    expect(
      encoder.dispatch(
        {
          type: OutgoingMessageType.quickReply,
          data: quickRepliesMessage,
        },
        handlers,
      ),
    ).toEqual(OutgoingMessageType.quickReply);
    expect(
      encoder.dispatch(
        {
          type: OutgoingMessageType.buttons,
          data: buttonsMessage,
        },
        handlers,
      ),
    ).toEqual(OutgoingMessageType.buttons);
    expect(
      encoder.dispatch(
        {
          type: OutgoingMessageType.attachment,
          data: attachmentMessage,
        },
        handlers,
      ),
    ).toEqual(OutgoingMessageType.attachment);
    expect(
      encoder.dispatch(
        {
          type: OutgoingMessageType.list,
          data: contentMessage,
        },
        handlers,
      ),
    ).toEqual(OutgoingMessageType.list);
    expect(
      encoder.dispatch(
        {
          type: OutgoingMessageType.carousel,
          data: contentMessage,
        },
        handlers,
      ),
    ).toEqual(OutgoingMessageType.carousel);
  });

  it('throws explicit error when dispatch receives unsupported format', () => {
    const handlers: EnvelopeHandlers<string, void> = {
      [OutgoingMessageType.text]: () => OutgoingMessageType.text,
      [OutgoingMessageType.quickReply]: () => OutgoingMessageType.quickReply,
      [OutgoingMessageType.buttons]: () => OutgoingMessageType.buttons,
      [OutgoingMessageType.attachment]: () => OutgoingMessageType.attachment,
      [OutgoingMessageType.list]: () => OutgoingMessageType.list,
      [OutgoingMessageType.carousel]: () => OutgoingMessageType.carousel,
    };

    expect(() =>
      encoder.dispatch(
        {
          type: 'unknown',
          data: textMessage,
        } as any,
        handlers as any,
      ),
    ).toThrow(UnsupportedOutgoingFormatError);
  });
});
