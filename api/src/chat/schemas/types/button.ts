/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
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
