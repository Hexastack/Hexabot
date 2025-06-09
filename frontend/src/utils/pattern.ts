/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Pattern } from "@/types/block.types";
import { PatternType } from "@/types/pattern.types";

import { isRegexString } from "./string";

/**
 * Determines the type of a given pattern and returns the corresponding `PatternType`.
 * Defaults to returning `PatternType.TEXT` if none of the conditions are met.
 *
 * @param pattern - The pattern to evaluate, which can be a string, array, or object.
 * @returns The determined `PatternType` for the given pattern.
 */
export const getPatternType = (pattern: Pattern): PatternType => {
  if (typeof pattern === "string") {
    return isRegexString(pattern) ? PatternType.REGEX : PatternType.TEXT;
  }

  if (Array.isArray(pattern)) {
    return PatternType.NLP;
  }

  if (pattern && typeof pattern === "object") {
    switch (pattern.type) {
      case "menu":
        return PatternType.MENU;
      case "content":
        return PatternType.CONTENT;
      case "outcome":
        return PatternType.OUTCOME;
      default:
        return PatternType.PAYLOAD;
    }
  }

  return PatternType.TEXT;
};
