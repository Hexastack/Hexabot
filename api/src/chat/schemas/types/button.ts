/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { z } from 'zod';

export enum ButtonType {
  postback = 'postback',
  web_url = 'web_url',
}

const postBackButtonSchema = z.object({
  type: z.literal(ButtonType.postback),
  title: z.string(),
  payload: z.string(),
});

const webUrlButtonSchema = z.object({
  type: z.literal(ButtonType.web_url),
  title: z.string(),
  url: z.union([z.string().url(), z.literal('')]),
  messenger_extensions: z.boolean().optional(),
  webview_height_ratio: z.enum(['compact', 'tall', 'full']).optional(),
});

export const buttonSchema = z.union([postBackButtonSchema, webUrlButtonSchema]);

export type PostBackButton = z.infer<typeof postBackButtonSchema>;

export type WebUrlButton = z.infer<typeof webUrlButtonSchema>;

export type Button = z.infer<typeof buttonSchema>;

export enum PayloadType {
  location = 'location',
  attachments = 'attachments',
  quick_reply = 'quick_reply',
  button = 'button',
  outcome = 'outcome',
  menu = 'menu',
  content = 'content',
}
