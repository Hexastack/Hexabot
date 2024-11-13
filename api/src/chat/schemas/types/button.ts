/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { z } from 'zod';

// Enum for ButtonType
export enum ButtonType {
  postback = 'postback',
  web_url = 'web_url',
}

// Zod schema for ButtonType
export const buttonTypeSchema = z.enum([
  ButtonType.postback,
  ButtonType.web_url,
]);

// Base schema for shared fields
export const baseButtonSchema = z.object({
  type: buttonTypeSchema,
  title: z.string().max(20),
});

// Conditional schemas
export const postBackButtonSchema = baseButtonSchema.extend({
  type: z.literal(ButtonType.postback),
  payload: z.string().max(1000),
  // No `url`, `messenger_extensions`, or `webview_height_ratio` fields here
});

export const webUrlButtonSchema = baseButtonSchema.extend({
  type: z.literal(ButtonType.web_url),
  url: z.string().url(),
  messenger_extensions: z.boolean().optional(),
  webview_height_ratio: z.enum(['compact', 'tall', 'full']).optional(),
  // No `payload` field here
});

// Union schema for Button
export const buttonSchema = z.union([postBackButtonSchema, webUrlButtonSchema]);

// Array schema for buttons
export const buttonsSchema = z.array(buttonSchema).max(3);

// Infer types
export type PostBackButton = z.infer<typeof postBackButtonSchema>;

export type WebUrlButton = z.infer<typeof webUrlButtonSchema>;

export type Button = z.infer<typeof buttonSchema>;
