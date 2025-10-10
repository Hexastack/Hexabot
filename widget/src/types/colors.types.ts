/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

export type ColorState = {
  header: { bg: string; text: string };
  launcher: { bg?: string };
  messageList: { bg?: string };
  sent: { bg?: string; text?: string; hover?: string };
  received: { bg?: string; text?: string; hover?: string };
  userInput: { bg?: string; text?: string };
  button: { bg?: string; text?: string; border?: string };
  messageStatus: { bg?: string; text?: string };
  messageTime: { text?: string };
};

export type ColorAction = {
  type:
    | "setPrimary"
    | "setSecondary"
    | "setText"
    | "setTextSecondary"
    | "updateComponent";
  payload: {
    component: keyof ColorState;
    value: { bg: string; text?: string; border?: string };
  };
};
