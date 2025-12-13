/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import {
  AttachmentAccess,
  AttachmentCreatedByRef,
  AttachmentResourceRef,
} from '@/attachment/types';
import { FileType } from '@/chat/types/attachment';
import { ButtonType } from '@/chat/types/button';
import {
  OutgoingMessageFormat,
  StdOutgoingAttachmentMessage,
  StdOutgoingButtonsMessage,
  StdOutgoingListMessage,
  StdOutgoingQuickRepliesMessage,
  StdOutgoingTextMessage,
} from '@/chat/types/message';
import { QuickReplyType } from '@/chat/types/quick-reply';

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

const MOCK_ATTACHMENT_ID = '11111111-1111-4111-8111-111111111111';
const attachment: AttachmentOrmEntity = Object.assign(
  new AttachmentOrmEntity(),
  {
    id: MOCK_ATTACHMENT_ID,
    name: 'attachment.jpg',
    type: 'image/jpeg',
    size: 3539,
    location: '39991e51-55c6-4a26-9176-b6ba04f180dc.jpg',
    channel: {
      ['any-channel']: {
        id: 'any-channel-attachment-id',
      },
    },
    resourceRef: AttachmentResourceRef.MessageAttachment,
    access: AttachmentAccess.Public,
    createdByRef: AttachmentCreatedByRef.User,
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
);

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
      desc: 'About being first',
      thumbnail: {
        type: 'image',
        payload: { id: attachment.id },
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
      desc: 'About being second',
      thumbnail: {
        type: 'image',
        payload: { id: attachment.id },
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
    limit: 2,
  },
};

export const attachmentMessage: StdOutgoingAttachmentMessage = {
  attachment: {
    type: FileType.image,
    payload: { id: attachment.id },
  },
  quickReplies: [
    {
      content_type: QuickReplyType.text,
      title: 'Next >',
      payload: 'NEXT',
    },
  ],
};
