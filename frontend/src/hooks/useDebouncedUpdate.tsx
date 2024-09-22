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
