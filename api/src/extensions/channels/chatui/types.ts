/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { z } from 'zod';

import { Web } from '@/extensions/channels/web/types';

export namespace ChatUiWeb {
  export const requestTypeSchema = z.enum(['sign_up', 'sign_in']);

  // Zod schema for sign-up validation
  export const signUpRequestSchema = z.object({
    type: z.literal('sign_up'),
    data: z.object({
      email: z.string().email({ message: 'Invalid email address' }),
      password: z
        .string()
        .min(8, { message: 'Password must be at least 8 characters long' }),
    }),
  });

  export type SignUpRequest = z.infer<typeof signUpRequestSchema>;

  export const signInSchema = z.object({
    type: z.literal('sign_in'),
    data: z.object({
      email: z.string().email({ message: 'Invalid email address' }),
      password: z.string().min(1, { message: 'Password is required' }),
    }),
  });

  export type SignInRequest = z.infer<typeof signInSchema>;

  export type Request = SignUpRequest | SignInRequest;

  export type Event = Web.IncomingMessage | Web.StatusEvent | Request;
}
