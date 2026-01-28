/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

export enum ButtonType {
  postback = 'postback',
  web_url = 'web_url',
}

const postBackButtonSchema = z.object({
  type: z.literal(ButtonType.postback).meta({
    title: 'Type',
    description: 'The type of button.',
  }),
  title: z.string().meta({
    title: 'Title',
    description: 'The label shown to the user.',
  }),
  payload: z.string().meta({
    title: 'Payload',
    description: 'The value sent back when the button is clicked.',
  }),
});
const webUrlButtonSchema = z.object({
  type: z.literal(ButtonType.web_url).meta({
    title: 'Type',
    description: 'The type of button.',
  }),
  title: z.string().meta({
    title: 'Title',
    description: 'The label shown to the user.',
  }),
  url: z.union([z.url(), z.literal('')]).meta({
    title: 'URL',
    description: 'The destination URL opened when the button is clicked.',
  }),
  messenger_extensions: z.boolean().optional().meta({
    title: 'Messenger extensions',
    description: 'Whether to enable Messenger Extensions for the webview.',
  }),
  webview_height_ratio: z.enum(['compact', 'tall', 'full']).optional().meta({
    title: 'Webview height ratio',
    description: 'The height of the webview.',
  }),
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
