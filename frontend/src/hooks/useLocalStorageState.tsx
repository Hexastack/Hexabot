/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { useEffect, useState } from "react";

export const useLocalStorageState = (key: string) => {
  const [value, setValue] = useState<string | null>("");

  if (typeof window !== "undefined") {
    // Client-side-only code
  }

  useEffect(() => {
    setValue(localStorage.getItem(key));
  }, []);

  const persist = (newValue: string) => {
    if (newValue !== value) {
      setValue(newValue);

      return localStorage.setItem(key, newValue);
    }

    return value;
  };
  const remove = () => {
    return localStorage.removeItem(key);
  };

  return { value, persist, remove };
};
