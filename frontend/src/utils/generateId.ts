/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
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
