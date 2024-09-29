/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Attachment } from '@/attachment/schemas/attachment.schema';
import { WithUrl } from '@/chat/schemas/types/attachment';
import { ButtonType } from '@/chat/schemas/types/button';
import {
  FileType,
  OutgoingMessageFormat,
  StdOutgoingAttachmentMessage,
  StdOutgoingButtonsMessage,
  StdOutgoingListMessage,
  StdOutgoingQuickRepliesMessage,
  StdOutgoingTextMessage,
} from '@/chat/schemas/types/message';
import { QuickReplyType } from '@/chat/schemas/types/quick-reply';

export const textMessage: StdOutgoingTextMessage = {
  text: 'Hello World',
};

export const quickRepliesMessage: StdOutgoingQuickRepliesMessage = {
  text: 'Choose one option',
  quickReplies: [
    {
      content_type: QuickReplyType.text,
      title: 'First option',
      payload: 'first_option',
    },
    {
      content_type: QuickReplyType.text,
      title: 'Second option',
      payload: 'second_option',
    },
  ],
};

export const buttonsMessage: StdOutgoingButtonsMessage = {
  text: 'Hit one of these buttons :',
  buttons: [
    {
      type: ButtonType.postback,
      title: 'First button',
      payload: 'first_button',
    },
    {
      type: ButtonType.web_url,
      title: 'Second button',
      url: 'http://button.com',
      messenger_extensions: true,
      webview_height_ratio: 'compact',
    },
  ],
};

export const urlButtonsMessage: StdOutgoingButtonsMessage = {
  text: 'Hit one of these buttons :',
  buttons: [
    {
      type: ButtonType.web_url,
      title: 'First button',
      url: 'http://button1.com',
      messenger_extensions: true,
      webview_height_ratio: 'compact',
    },
    {
      type: ButtonType.web_url,
      title: 'Second button',
      url: 'http://button2.com',
      messenger_extensions: true,
      webview_height_ratio: 'compact',
    },
  ],
};

const attachment: Attachment = {
  id: '1',
  name: 'attachment.jpg',
  type: 'image/jpeg',
  size: 3539,
  location: '39991e51-55c6-4a26-9176-b6ba04f180dc.jpg',
  channel: {
    ['dimelo']: {
      id: 'attachment-id-dimelo',
    },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const attachmentWithUrl: WithUrl<Attachment> = {
  ...attachment,
  url: 'http://localhost:4000/attachment/download/1/attachment.jpg',
};

export const contentMessage: StdOutgoingListMessage = {
  options: {
    display: OutgoingMessageFormat.list,
    fields: {
      title: 'title',
      subtitle: 'desc',
      image_url: 'thumbnail',
    },
    buttons: [
      {
        type: ButtonType.postback,
        title: 'More',
        payload: '',
      },
    ],
    limit: 2,
  },
  elements: [
    {
      id: '1',
      entity: 'rank',
      title: 'First',
      // @ts-expect-error Necessary workaround
      desc: 'About being first',
      thumbnail: {
        payload: attachmentWithUrl,
      },
      getPayload() {
        return this.title;
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      status: true,
    },
    {
      id: '2',
      entity: 'rank',
      title: 'Second',
      // @ts-expect-error Necessary workaround
      desc: 'About being second',
      thumbnail: {
        payload: attachmentWithUrl,
      },
      getPayload() {
        return this.title;
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      status: true,
    },
  ],
  pagination: {
    total: 3,
    skip: 0,
    limit: 1,
  },
};

export const attachmentMessage: StdOutgoingAttachmentMessage<
  WithUrl<Attachment>
> = {
  attachment: {
    type: FileType.image,
    payload: attachmentWithUrl,
  },
  quickReplies: [
    {
      content_type: QuickReplyType.text,
      title: 'Next >',
      payload: 'NEXT',
    },
  ],
};
