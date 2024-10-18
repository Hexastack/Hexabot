/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { textMessage } from '@/channel/lib/__test__/common.mock';
import { VIEW_MORE_PAYLOAD } from '@/chat/helpers/constants';
import { ButtonType } from '@/chat/schemas/types/button';
import { FileType } from '@/chat/schemas/types/message';
import { QuickReplyType } from '@/chat/schemas/types/quick-reply';

import { Offline } from '../types';

export const offlineText: Offline.OutgoingMessageBase = {
  type: Offline.OutgoingMessageType.text,
  data: textMessage,
};

export const offlineQuickReplies: Offline.OutgoingMessageBase = {
  data: {
    quick_replies: [
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
    text: 'Choose one option',
  },
  type: Offline.OutgoingMessageType.quick_replies,
};

export const offlineButtons: Offline.OutgoingMessageBase = {
  data: {
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
    text: 'Hit one of these buttons :',
  },
  type: Offline.OutgoingMessageType.buttons,
};

export const offlineList: Offline.OutgoingMessageBase = {
  data: {
    buttons: [
      {
        payload: VIEW_MORE_PAYLOAD,
        title: 'View More',
        type: ButtonType.postback,
      },
    ],
    elements: [
      {
        buttons: [
          {
            payload: 'More:First',
            title: 'More',
            type: ButtonType.postback,
          },
        ],
        image_url: 'http://localhost:4000/attachment/download/1/attachment.jpg',
        subtitle: 'About being first',
        title: 'First',
      },
      {
        buttons: [
          {
            payload: 'More:Second',
            title: 'More',
            type: ButtonType.postback,
          },
        ],
        image_url: 'http://localhost:4000/attachment/download/1/attachment.jpg',
        subtitle: 'About being second',
        title: 'Second',
      },
    ],
  },
  type: Offline.OutgoingMessageType.list,
};

export const offlineCarousel: Offline.OutgoingMessageBase = {
  data: {
    elements: [
      {
        buttons: [
          {
            payload: 'More:First',
            title: 'More',
            type: ButtonType.postback,
          },
        ],
        image_url: 'http://localhost:4000/attachment/download/1/attachment.jpg',
        subtitle: 'About being first',
        title: 'First',
      },
      {
        buttons: [
          {
            payload: 'More:Second',
            title: 'More',
            type: ButtonType.postback,
          },
        ],
        image_url: 'http://localhost:4000/attachment/download/1/attachment.jpg',
        subtitle: 'About being second',
        title: 'Second',
      },
    ],
  },
  type: Offline.OutgoingMessageType.carousel,
};

export const offlineAttachment: Offline.OutgoingMessageBase = {
  data: {
    quick_replies: [
      {
        content_type: QuickReplyType.text,
        payload: 'NEXT',
        title: 'Next >',
      },
    ],
    type: FileType.image,
    url: 'http://localhost:4000/attachment/download/1/attachment.jpg',
  },
  type: Offline.OutgoingMessageType.file,
};
