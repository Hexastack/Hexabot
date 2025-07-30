/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
