/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { z } from 'zod';

// Zod schema for CaptureVar
const captureVarSchema = z.object({
  entity: z.union([
    // entity=`-1` to match text message
    // entity=`-2` for postback payload
    // entity is `String` for NLP entities
    z
      .number()
      .int()
      .refine((val) => val === -1 || val === -2, {
        message: "entity must be -1 or -2 when it's a number",
      }),
    z.string(), // entity is a string for NLP entities
  ]),
  context_var: z.string(),
});

// Infer the TypeScript type
type CaptureVar = z.infer<typeof captureVarSchema>;

// Export the schema and type
export { CaptureVar, captureVarSchema };
