/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { IBlockAttributes } from "@/types/block.types";
import {
  ButtonType,
  FileType,
  OutgoingMessageFormat,
  PayloadType,
  QuickReplyType,
  StdOutgoingListMessage,
} from "@/types/message.types";

export const SIMPLE_TEXT_BLOCK_TEMPLATE: Partial<IBlockAttributes> = {
  patterns: ["Hi"],
  options: {
    typing: 0,
    fallback: { active: false, max_attempts: 1, message: [] },
  },
  message: ["Hi back !"],
  starts_conversation: false,
};

export const ATTACHMENT_BLOCK_TEMPLATE: Partial<IBlockAttributes> = {
  patterns: ["image"],
  options: {
    typing: 0,
    fallback: { active: false, max_attempts: 1, message: [] },
  },
  message: {
    attachment: {
      type: FileType.unknown,
      payload: { id: null },
    },
    quickReplies: [],
  },
  starts_conversation: true,
};

export const QUICK_REPLIES_BLOCK_TEMPLATE: Partial<IBlockAttributes> = {
  patterns: ["colors"],
  options: {
    typing: 0,
    fallback: { active: false, max_attempts: 1, message: [] },
  },
  message: {
    text: "What's your favorite color?",
    quickReplies: [
      {
        content_type: QuickReplyType.text,
        title: "Green",
        payload: "Green",
      },
      {
        content_type: QuickReplyType.text,
        title: "Yellow",
        payload: "Yellow",
      },
      { content_type: QuickReplyType.text, title: "Red", payload: "Red" },
    ],
  },
  starts_conversation: false,
};

export const BUTTONS_BLOCK_TEMPLATE: Partial<IBlockAttributes> = {
  patterns: ["about"],
  options: {
    typing: 0,
    fallback: { active: false, max_attempts: 1, message: [] },
  },
  message: {
    text: "What would you like to know about us?",
    buttons: [
      { type: ButtonType.postback, title: "Vision", payload: "Vision" },
      { type: ButtonType.postback, title: "Values", payload: "Values" },
      {
        type: ButtonType.postback,
        title: "Approach",
        payload: "Approach",
      },
    ],
  },
  starts_conversation: false,
};

export const LIST_BLOCK_TEMPLATE: Partial<IBlockAttributes> = {
  patterns: ["coffee"],
  options: {
    typing: 0,
    fallback: { active: false, max_attempts: 1, message: [] },
    content: {
      display: OutgoingMessageFormat.list,
      limit: 2,
      entity: null,
      fields: {
        title: "title",
        subtitle: "",
        image_url: "",
        url: "",
        action_title: "",
      },
      top_element_style: "compact",
      buttons: [
        {
          title: "View",
          type: ButtonType.web_url,
          messenger_extensions: true,
          webview_height_ratio: "tall",
          url: "",
        },
      ],
    },
  },
  message: { elements: true } as unknown as StdOutgoingListMessage,
  starts_conversation: false,
};

export const CUSTOM_BLOCK_TEMPLATE: Partial<IBlockAttributes> = {
  patterns: [
    {
      label: "User location",
      value: "",
      type: PayloadType.location,
    },
  ],
  capture_vars: [],
  options: {
    typing: 0,
    fallback: { active: false, max_attempts: 1, message: [] },
  },
  starts_conversation: false,
  message: {
    plugin: "storelocator",
    args: {
      fallback_msg: ["Sorry but no data is available for the moment :("],
      max_results: 3,
      btn_title: "Go !",
    },
  },
};

export const ZOOM_LEVEL = {
  minimum: 15,
  maximum: 280,
  step: 10,
};
