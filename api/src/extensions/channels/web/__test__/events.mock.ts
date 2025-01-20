/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FileType } from '@/chat/schemas/types/attachment';
import {
  IncomingMessageType,
  StdEventType,
} from '@/chat/schemas/types/message';

import { Web } from '../types';

// Web events
const webEventPayload: Web.Event = {
  type: Web.IncomingMessageType.postback,
  data: {
    text: 'Get Started',
    payload: 'GET_STARTED',
  },
  author: 'web-9be7aq09-b45a-452q-bcs0-f145b9qce1cad',
  mid: 'web-event-payload',
  read: true,
};

export const webEventText: Web.IncomingMessage<Web.IncomingTextMessage> = {
  type: Web.IncomingMessageType.text,
  data: {
    text: 'Hello',
  },
  author: 'web-9qsdfgqxac09-f83a-452d-bca0-f1qsdqg457c1ad',
  mid: 'web-event-text',
  read: true,
};

const webEventLocation: Web.IncomingMessage = {
  type: Web.IncomingMessageType.location,
  data: {
    coordinates: {
      lat: 2.0545,
      lng: 12.2558,
    },
  },
  author: 'web-9beqsdqa09-b489a-438c-bqd0-f11buykkhl851ad',
  mid: 'web-event-location',
  read: true,
};

const webEventFile: Web.Event = {
  type: Web.IncomingMessageType.file,
  data: {
    type: 'image/png',
    size: 500,
    name: 'filename.extension',
    file: Buffer.from('my-image', 'utf-8'),
  },
  author: 'web-9be8ac09-b43a-432d-bca0-f11b98cec1ad',
  mid: 'web-event-file',
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

export const webEvents: [string, Web.IncomingMessage, any][] = [
  [
    'Payload Event',
    webEventPayload,
    {
      channelData: payloadChannelData,
      id: webEventPayload.mid,
      eventType: StdEventType.message,
      messageType: IncomingMessageType.postback,
      payload: webEventPayload.data.payload,
      message: {
        postback: webEventPayload.data.payload,
        text: webEventPayload.data.text,
      },
    },
  ],
  [
    'Text Event',
    webEventText,
    {
      channelData: textChannelData,
      id: webEventText.mid,
      eventType: StdEventType.message,
      messageType: IncomingMessageType.message,
      payload: undefined,
      message: {
        text: webEventText.data.text,
      },
    },
  ],
  [
    'Location Event',
    webEventLocation,
    {
      channelData: locationChannelData,
      id: webEventLocation.mid,
      eventType: StdEventType.message,
      messageType: IncomingMessageType.location,
      payload: {
        type: Web.IncomingMessageType.location,
        coordinates: {
          lat: webEventLocation.data.coordinates.lat,
          lon: webEventLocation.data.coordinates.lng,
        },
      },
      message: {
        type: Web.IncomingMessageType.location,
        coordinates: {
          lat: webEventLocation.data.coordinates.lat,
          lon: webEventLocation.data.coordinates.lng,
        },
      },
    },
  ],
  [
    'File Event',
    webEventFile,
    {
      channelData: fileChannelData,
      id: webEventFile.mid,
      eventType: StdEventType.message,
      messageType: IncomingMessageType.attachments,
      payload: {
        type: IncomingMessageType.attachments,
        attachment: {
          type: FileType.image,
          payload: {
            id: '9'.repeat(24),
          },
        },
      },
      message: {
        attachment: {
          payload: {
            id: '9'.repeat(24),
          },
          type: FileType.image,
        },
        serialized_text: 'attachment:image:filename.extension',
        type: IncomingMessageType.attachments,
      },
    },
  ],
];
