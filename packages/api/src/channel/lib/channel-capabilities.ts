/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { OutgoingMessageFormat } from '@/chat/types/message';

/**
 * Declares which outgoing message formats and transport features a channel
 * supports. The base handler uses this at send time to reject envelopes that
 * would silently fail or throw on the channel side.
 *
 * Set `maxTextLength` to 0 to indicate no known limit.
 */
export interface ChannelCapabilities {
  [OutgoingMessageFormat.text]: boolean;
  [OutgoingMessageFormat.quickReplies]: boolean;
  [OutgoingMessageFormat.buttons]: boolean;
  [OutgoingMessageFormat.attachment]: boolean;
  [OutgoingMessageFormat.list]: boolean;
  [OutgoingMessageFormat.carousel]: boolean;
  typingIndicator: boolean;
  maxTextLength: number;
}

/** Full-featured default — channels override specific fields to restrict. */
export const DEFAULT_CHANNEL_CAPABILITIES: Readonly<ChannelCapabilities> = {
  [OutgoingMessageFormat.text]: true,
  [OutgoingMessageFormat.quickReplies]: true,
  [OutgoingMessageFormat.buttons]: true,
  [OutgoingMessageFormat.attachment]: true,
  [OutgoingMessageFormat.list]: true,
  [OutgoingMessageFormat.carousel]: true,
  typingIndicator: false,
  maxTextLength: 0,
};
