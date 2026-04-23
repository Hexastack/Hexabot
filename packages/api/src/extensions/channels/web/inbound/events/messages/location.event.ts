/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  PayloadType,
  IncomingMessageType,
  StdIncomingMessage,
  Payload,
} from '@hexabot-ai/types';

import { ChannelInboundEventContext } from '@/channel/lib/inbound-events';
import { ChannelName } from '@/channel/types';

import { Web } from '../../../types';

import WebMessageInboundEvent from './web-message.event';

export class LocationMessageInboundEvent<
  N extends ChannelName = ChannelName,
> extends WebMessageInboundEvent<
  N,
  Web.InboundMessage<Web.IncomingLocationMessage>
> {
  constructor(
    context: ChannelInboundEventContext<
      N,
      Web.InboundMessage<Web.IncomingLocationMessage>,
      SubscriberChannelDict[N]
    >,
    private readonly latitude: number,
    private readonly longitude: number,
  ) {
    super(context);
  }

  override getMessageType(): IncomingMessageType {
    return IncomingMessageType.location;
  }

  override getPayload(): Payload {
    return {
      type: PayloadType.location,
      coordinates: {
        lat: this.latitude,
        lon: this.longitude,
      },
    };
  }

  override toStdIncomingMessage(): StdIncomingMessage {
    return {
      type: IncomingMessageType.location,
      data: {
        coordinates: {
          lat: this.latitude,
          lon: this.longitude,
        },
      },
    };
  }
}

export default LocationMessageInboundEvent;
