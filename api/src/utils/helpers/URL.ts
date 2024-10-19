/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

export const buildURL = (baseUrl: string, relativePath: string): string => {
  try {
    return new URL(relativePath).toString();
  } catch {
    try {
      return new URL(
        relativePath.replace(/^\//, ''),
        baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`,
      ).toString();
    } catch {
      throw new Error(`Invalid base URL: ${baseUrl}`);
    }
  }
};
