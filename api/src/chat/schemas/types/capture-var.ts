/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { z } from 'zod';

// entity=`-1` to match text message
// entity=`-2` for postback payload
// entity is `String` for NLP entities
export const captureVarSchema = z.object({
  entity: z.union([z.number().min(-2).max(-1), z.string()]),
  context_var: z.string().regex(/^[a-z][a-z_0-9]*$/),
});

export type CaptureVar = z.infer<typeof captureVarSchema>;
