/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { csrfSync } from 'csrf-sync';
import { Request } from 'express';

import { config } from '.';

export const csrf = csrfSync({
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req: Request) =>
    (req.headers['x-csrf-token'] as string) ??
    (req.body?._csrf as string) ??
    (req.query?._csrf as string) ??
    undefined,
  skipCsrfProtection: (req) => {
    return config.security.csrfExclude.some((re) => re.test(req.path));
  },
});
