/*
 * Copyright © 2025 Hexastack. All rights reserved.
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

import { Web } from '../types';

export const webText: Web.OutgoingMessageBase = {
  type: Web.OutgoingMessageType.text,
  data: textMessage,
};

export const webQuickReplies: Web.OutgoingMessageBase = {
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
  type: Web.OutgoingMessageType.quick_replies,
};

export const webButtons: Web.OutgoingMessageBase = {
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
  type: Web.OutgoingMessageType.buttons,
};

export const webList: Web.OutgoingMessageBase = {
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
        image_url: 'http://public.url/download/filename.extension?t=any',
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
        image_url: 'http://public.url/download/filename.extension?t=any',
        subtitle: 'About being second',
        title: 'Second',
      },
    ],
  },
  type: Web.OutgoingMessageType.list,
};

export const webCarousel: Web.OutgoingMessageBase = {
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
        image_url: 'http://public.url/download/filename.extension?t=any',
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
        image_url: 'http://public.url/download/filename.extension?t=any',
        subtitle: 'About being second',
        title: 'Second',
      },
    ],
  },
  type: Web.OutgoingMessageType.carousel,
};

export const webAttachment: Web.OutgoingMessageBase = {
  data: {
    quick_replies: [
      {
        content_type: QuickReplyType.text,
        payload: 'NEXT',
        title: 'Next >',
      },
    ],
    type: FileType.image,
    url: 'http://public.url/download/filename.extension?t=any',
  },
  type: Web.OutgoingMessageType.file,
};
