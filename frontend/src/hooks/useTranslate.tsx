/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { TOptionsBase } from "i18next";
import { useTranslation } from "react-i18next";

import { TTranslateProps, TTranslationKeys } from "@/i18n/i18n.types";

export const useTranslate = () => {
  const { t, i18n } = useTranslation();
  const translate: TTranslateProps = (
    prop1: unknown,
    prop2?: unknown,
    prop3?: unknown,
  ): string => {
    // full key. For example: prop1 = label.buttons
    if (typeof prop1 === "string" && prop1.includes(".")) {
      const key = prop1 as TTranslationKeys;
      const options = (prop2 || {}) as TOptionsBase;

      return t(key, { defaultValue: "", ...options });
    }

    // key with nested key. For example: prop1=label prop2=buttons
    const options = (prop3 || {}) as TOptionsBase;

    return t([prop1, prop2].join(".") as TTranslationKeys, {
      defaultValue: "",
      ...options,
    });
  };

  return {
    t: translate,
    i18n,
  };
};
