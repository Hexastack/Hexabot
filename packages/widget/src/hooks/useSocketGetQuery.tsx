/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useEffect, useState } from "react";

import { useSocket } from "../providers/SocketProvider";

type UseSocketGetQueryReturnType<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isError: boolean;
};

function useSocketGetQuery<T>(url: string): UseSocketGetQueryReturnType<T> {
  const { socket } = useSocket();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const response = await socket.get<T>(url);

        if (response.statusCode < 200 || response.statusCode > 299) {
          throw new Error(`HTTP error! status: ${response.statusCode}`);
        }

        setData(response.body);
      } catch (error) {
        setError((error as Error).message);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return { data, isLoading, error, isError };
}

export default useSocketGetQuery;
