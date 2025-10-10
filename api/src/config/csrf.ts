/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { doubleCsrf } from 'csrf-csrf';

import { config } from '.';

export const csrf = doubleCsrf({
  getSecret: () => {
    return config.session.secret;
  },
  getSessionIdentifier: (req) => {
    return req.session.id;
  },
  cookieName:
    config.env === 'production' && config.security.httpsEnabled
      ? '__Secure-hexabot.x-csrf-token'
      : '__Host-hexabot.x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    secure: config.security.httpsEnabled,
    path: '/',
  },
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  skipCsrfProtection: (req) => {
    return config.security.csrfExclude.some((re) => re.test(req.path));
  },
  getCsrfTokenFromRequest: (req: any) =>
    (req.headers['x-csrf-token'] as string) ??
    (req.body?._csrf as string) ??
    undefined,
});
