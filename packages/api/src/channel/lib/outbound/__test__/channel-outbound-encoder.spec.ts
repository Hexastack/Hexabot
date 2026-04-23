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
  inferOutgoingMessageEnvelope,
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

  it('infers outgoing envelope format from message payload', () => {
    expect(inferOutgoingMessageEnvelope(textMessage).format).toEqual(
      OutgoingMessageFormat.text,
    );
    expect(inferOutgoingMessageEnvelope(quickRepliesMessage).format).toEqual(
      OutgoingMessageFormat.quickReplies,
    );
    expect(inferOutgoingMessageEnvelope(buttonsMessage).format).toEqual(
      OutgoingMessageFormat.buttons,
    );
    expect(inferOutgoingMessageEnvelope(attachmentMessage).format).toEqual(
      OutgoingMessageFormat.attachment,
    );
    expect(inferOutgoingMessageEnvelope(contentMessage).format).toEqual(
      OutgoingMessageFormat.list,
    );
    expect(
      inferOutgoingMessageEnvelope({
        ...contentMessage,
        options: {
          ...contentMessage.options,
          display: OutgoingMessageFormat.carousel,
        },
      }).format,
    ).toEqual(OutgoingMessageFormat.carousel);
  });

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
          message: textMessage,
        },
        handlers,
      ),
    ).toEqual(OutgoingMessageFormat.text);
    expect(
      encoder.dispatch(
        {
          format: OutgoingMessageFormat.quickReplies,
          message: quickRepliesMessage,
        },
        handlers,
      ),
    ).toEqual(OutgoingMessageFormat.quickReplies);
    expect(
      encoder.dispatch(
        {
          format: OutgoingMessageFormat.buttons,
          message: buttonsMessage,
        },
        handlers,
      ),
    ).toEqual(OutgoingMessageFormat.buttons);
    expect(
      encoder.dispatch(
        {
          format: OutgoingMessageFormat.attachment,
          message: attachmentMessage,
        },
        handlers,
      ),
    ).toEqual(OutgoingMessageFormat.attachment);
    expect(
      encoder.dispatch(
        {
          format: OutgoingMessageFormat.list,
          message: contentMessage,
        },
        handlers,
      ),
    ).toEqual(OutgoingMessageFormat.list);
    expect(
      encoder.dispatch(
        {
          format: OutgoingMessageFormat.carousel,
          message: contentMessage,
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
          message: textMessage,
        } as any,
        handlers as any,
      ),
    ).toThrow(UnsupportedOutgoingFormatError);
  });
});
