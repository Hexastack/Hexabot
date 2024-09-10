/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { FileType } from '@/chat/schemas/types/attachment';
import {
  IncomingMessageType,
  StdEventType,
} from '@/chat/schemas/types/message';

import { Offline } from '../types';

const img_url =
  'http://demo.hexabot.io/attachment/download/5c334078e2c41d11206bd152/myimage.png';

// Offline events
const offlineEventPayload: Offline.Event = {
  type: Offline.IncomingMessageType.postback,
  data: {
    text: 'Get Started',
    payload: 'GET_STARTED',
  },
  author: 'offline-9be7aq09-b45a-452q-bcs0-f145b9qce1cad',
  mid: 'offline-event-payload',
  read: true,
};

export const offlineEventText: Offline.IncomingMessage<Offline.IncomingTextMessage> =
  {
    type: Offline.IncomingMessageType.text,
    data: {
      text: 'Hello',
    },
    author: 'offline-9qsdfgqxac09-f83a-452d-bca0-f1qsdqg457c1ad',
    mid: 'offline-event-text',
    read: true,
  };

const offlineEventLocation: Offline.IncomingMessage = {
  type: Offline.IncomingMessageType.location,
  data: {
    coordinates: {
      lat: 2.0545,
      lng: 12.2558,
    },
  },
  author: 'offline-9beqsdqa09-b489a-438c-bqd0-f11buykkhl851ad',
  mid: 'offline-event-location',
  read: true,
};

const offlineEventFile: Offline.Event = {
  type: Offline.IncomingMessageType.file,
  data: {
    type: FileType.image,
    url: img_url,
    size: 500,
  },
  author: 'offline-9be8ac09-b43a-432d-bca0-f11b98cec1ad',
  mid: 'offline-event-file',
  read: true,
};

const payloadChannelData = {
  isSocket: true,
  ipAddress: '0.0.0.0',
};

const textChannelData = {
  isSocket: false,
  ipAddress: '1.1.1.1',
};

const locationChannelData = {
  isSocket: true,
  ipAddress: '2.2.2.2',
};

const fileChannelData = {
  isSocket: false,
  ipAddress: '3.3.3.3',
};

export const offlineEvents: [string, Offline.IncomingMessage, any][] = [
  [
    'Payload Event',
    offlineEventPayload,
    {
      channelData: payloadChannelData,
      id: offlineEventPayload.mid,
      eventType: StdEventType.message,
      messageType: IncomingMessageType.postback,
      payload: offlineEventPayload.data.payload,
      message: {
        postback: offlineEventPayload.data.payload,
        text: offlineEventPayload.data.text,
      },
    },
  ],
  [
    'Text Event',
    offlineEventText,
    {
      channelData: textChannelData,
      id: offlineEventText.mid,
      eventType: StdEventType.message,
      messageType: IncomingMessageType.message,
      payload: undefined,
      message: {
        text: offlineEventText.data.text,
      },
    },
  ],
  [
    'Location Event',
    offlineEventLocation,
    {
      channelData: locationChannelData,
      id: offlineEventLocation.mid,
      eventType: StdEventType.message,
      messageType: IncomingMessageType.location,
      payload: {
        type: Offline.IncomingMessageType.location,
        coordinates: {
          lat: offlineEventLocation.data.coordinates.lat,
          lon: offlineEventLocation.data.coordinates.lng,
        },
      },
      message: {
        type: Offline.IncomingMessageType.location,
        coordinates: {
          lat: offlineEventLocation.data.coordinates.lat,
          lon: offlineEventLocation.data.coordinates.lng,
        },
      },
    },
  ],
  [
    'File Event',
    offlineEventFile,
    {
      channelData: fileChannelData,
      id: offlineEventFile.mid,
      eventType: StdEventType.message,
      messageType: IncomingMessageType.attachments,
      payload: {
        type: IncomingMessageType.attachments,
        attachments: {
          type: FileType.image,
          payload: {
            url: img_url,
          },
        },
      },
      message: {
        attachment: {
          payload: {
            url: img_url,
          },
          type: FileType.image,
        },
        serialized_text: `attachment:image:${img_url}`,
        type: IncomingMessageType.attachments,
      },
    },
  ],
];
