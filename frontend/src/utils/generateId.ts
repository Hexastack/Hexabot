/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { getRandom } from "./safeRandom";

export const generateId = () => {
  const d =
    typeof performance === "undefined" ? Date.now() : performance.now() * 1000;

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (getRandom() * 16 + d) % 16 | 0;

    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};
