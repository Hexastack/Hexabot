/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  customerLabelsMock,
  labelMock,
} from '@/channel/lib/__test__/label.mock';
import { BlockFull } from '@/chat/schemas/block.schema';
import { FileType } from '@/chat/schemas/types/attachment';
import { ButtonType } from '@/chat/schemas/types/button';
import {
  OutgoingMessageFormat,
  PayloadType,
} from '@/chat/schemas/types/message';
import { BlockOptions, ContentOptions } from '@/chat/schemas/types/options';
import { Pattern } from '@/chat/schemas/types/pattern';
import { QuickReplyType } from '@/chat/schemas/types/quick-reply';
import { CaptureVar } from '@/chat/validation-rules/is-valid-capture';

import { modelInstance } from './misc';

const blockOptions: BlockOptions = {
  typing: 0,
  fallback: {
    active: false,
    max_attempts: 1,
    message: [],
  },
};

const blockListOptions: BlockOptions = {
  content: {
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
    entity: 1,
  },
};

const blockCarouselOptions: BlockOptions = {
  content: {
    display: OutgoingMessageFormat.carousel,
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
    limit: 3,
    entity: 1,
  },
};

const captureVar: CaptureVar = {
  entity: -2,
  context_var: 'string',
};

const position = {
  x: 0,
  y: 0,
};

export const baseBlockInstance = {
  trigger_labels: [labelMock],
  assign_labels: [labelMock],
  options: blockOptions,
  starts_conversation: false,
  capture_vars: [captureVar],
  position,
  builtin: true,
  attachedBlock: null,
  category: undefined,
  previousBlocks: [],
  trigger_channels: [],
  ...modelInstance,
};

export const blockEmpty: BlockFull = {
  ...baseBlockInstance,
  name: 'Empty',
  patterns: [],
  message: [''],
};

// Translation Data
export const textResult = ['Hi back !'];

export const textBlock: BlockFull = {
  name: 'message',
  patterns: ['Hi'],
  message: textResult,
  ...baseBlockInstance,
};

export const quickRepliesResult = [
  "What's your favorite color?",
  'Green',
  'Yellow',
  'Red',
];

export const quickRepliesBlock: BlockFull = {
  name: 'message',
  patterns: ['colors'],
  message: {
    text: "What's your favorite color?",
    quickReplies: [
      {
        content_type: QuickReplyType.text,
        title: 'Green',
        payload: 'Green',
      },
      {
        content_type: QuickReplyType.text,
        title: 'Yellow',
        payload: 'Yellow',
      },
      {
        content_type: QuickReplyType.text,
        title: 'Red',
        payload: 'Red',
      },
    ],
  },
  ...baseBlockInstance,
};

export const buttonsResult = [
  'What would you like to know about us?',
  'Vision',
  'Values',
  'Approach',
];

export const buttonsBlock: BlockFull = {
  name: 'message',
  patterns: ['about'],
  message: {
    text: 'What would you like to know about us?',
    buttons: [
      {
        type: ButtonType.postback,
        title: 'Vision',
        payload: 'Vision',
      },
      {
        type: ButtonType.postback,
        title: 'Values',
        payload: 'Values',
      },
      {
        type: ButtonType.postback,
        title: 'Approach',
        payload: 'Approach',
      },
    ],
  },
  ...baseBlockInstance,
};

export const attachmentBlock: BlockFull = {
  name: 'message',
  patterns: ['image'],
  message: {
    attachment: {
      type: FileType.image,
      payload: {
        url: 'https://fr.facebookbrand.com/wp-content/uploads/2016/09/messenger_icon2.png',
        attachment_id: '1234',
      },
    },
    quickReplies: [],
  },
  ...baseBlockInstance,
};

export const allBlocksStringsResult = [
  'Hi back !',
  'What"s your favorite color?',
  'Green',
  'Yellow',
  'Red',
  'What would you like to know about us?',
  'Vision',
  'Values',
  'Approach',
  ':)',
  ':D',
  ';)',
];

/////////

export const blockGetStarted: BlockFull = {
  ...baseBlockInstance,
  name: 'Get Started',
  patterns: [
    'Hello',
    '/we*lcome/',
    { label: 'Get Started', value: 'GET_STARTED' },
    {
      label: 'Tounes',
      value: 'Tounes',
      type: PayloadType.location,
    },
    {
      label: 'Livre',
      value: 'Livre',
      type: PayloadType.attachments,
    },
    [
      {
        entity: 'intent',
        match: 'value',
        value: 'greeting',
      },
      {
        entity: 'firstname',
        match: 'entity',
      },
    ],
  ],
  trigger_labels: customerLabelsMock,
  message: ['Welcome! How are you ? '],
};

const patternsProduct: Pattern[] = [
  'produit',
  [
    {
      entity: 'intent',
      match: 'value',
      value: 'product',
    },
    {
      entity: 'vetement',
      match: 'entity',
    },
  ],
];

export const blockProductListMock: BlockFull = {
  ...baseBlockInstance,
  name: 'test_list',
  patterns: patternsProduct,
  trigger_labels: customerLabelsMock,
  assign_labels: [],
  options: blockListOptions,
  message: {
    options: blockListOptions.content as ContentOptions,
    elements: [],
    pagination: {
      total: 0,
      skip: 0,
      limit: 0,
    },
  },
};

export const blockCarouselMock: BlockFull = {
  ...blockProductListMock,
  options: blockCarouselOptions,
};

export const blocks: BlockFull[] = [blockGetStarted, blockEmpty];
