/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { OutgoingMessageType } from '@hexabot-ai/types';

/**
 * Declares which outgoing message formats and transport features a channel
 * supports. The base handler uses this at send time to reject envelopes that
 * would silently fail or throw on the channel side.
 *
 * Set `maxTextLength` to 0 to indicate no known limit.
 */
export interface ChannelCapabilities {
  [OutgoingMessageType.text]: boolean;
  [OutgoingMessageType.quickReply]: boolean;
  [OutgoingMessageType.buttons]: boolean;
  [OutgoingMessageType.attachment]: boolean;
  [OutgoingMessageType.list]: boolean;
  [OutgoingMessageType.carousel]: boolean;
  typingIndicator: boolean;
  maxTextLength: number;
}

/** Full-featured default — channels override specific fields to restrict. */
export const DEFAULT_CHANNEL_CAPABILITIES: Readonly<ChannelCapabilities> = {
  [OutgoingMessageType.text]: true,
  [OutgoingMessageType.quickReply]: true,
  [OutgoingMessageType.buttons]: true,
  [OutgoingMessageType.attachment]: true,
  [OutgoingMessageType.list]: true,
  [OutgoingMessageType.carousel]: true,
  typingIndicator: false,
  maxTextLength: 0,
};
