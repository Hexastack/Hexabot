/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { debounce } from "@mui/material";
import { useCallback, useEffect, useRef } from "react";

type DebouncedUpdateParams = {
  id: string;
  params: Record<string, any>;
};

function useDebouncedUpdate(
  apiUpdate: (params: DebouncedUpdateParams) => void,
  delay: number = 300,
) {
  const accumulatedUpdates = useRef<DebouncedUpdateParams | null>(null);
  const processUpdates = useRef(
    debounce(() => {
      if (accumulatedUpdates.current) {
        apiUpdate(accumulatedUpdates.current);
        accumulatedUpdates.current = null;
      }
    }, delay),
  ).current;
  const handleUpdate = useCallback(
    (params: DebouncedUpdateParams) => {
      accumulatedUpdates.current = {
        id: params.id,
        params: {
          ...(accumulatedUpdates.current?.params || {}),
          ...params.params,
        },
      };
      processUpdates();
    },
    [processUpdates],
  );

  useEffect(() => {
    return () => {
      processUpdates.clear();
    };
  }, [processUpdates]);

  return handleUpdate;
}

export default useDebouncedUpdate;
