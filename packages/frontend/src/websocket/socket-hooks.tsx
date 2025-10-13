/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { QueryOptions, useQuery } from "react-query";

import { useAuth } from "@/hooks/useAuth";
import { useConfig } from "@/hooks/useConfig";
import { useToast } from "@/hooks/useToast";

import { SocketIoClient } from "./SocketIoClient";

interface socketContext {
  socket: SocketIoClient | null;
  connected: boolean;
}

const socketContext = createContext<socketContext>({
  socket: null,
  connected: false,
});

export const useSocket = () => {
  return useContext(socketContext);
};

export const SocketProvider = (props: PropsWithChildren) => {
  const { apiUrl } = useConfig();
  const [connected, setConnected] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const socket = useMemo(() => new SocketIoClient(apiUrl), [apiUrl]);

  useEffect(() => {
    if (user && apiUrl)
      socket.init({
        onConnect: () => {
          setConnected(true);
        },
        onConnectError: () => {
          setConnected(false);
        },
        onDisconnect: () => {
          setConnected(false);
        },
      });
  }, [socket, toast, user, apiUrl]);

  return (
    <socketContext.Provider value={{ socket, connected }}>
      {props.children}
    </socketContext.Provider>
  );
};

export const useSocketConnected = () => {
  const { connected } = useSocket();

  return connected;
};

export const useSubscribe = <T,>(event: string, callback: (arg: T) => void) => {
  const { socket } = useSocket();

  useEffect(() => {
    socket?.on<T>(event, callback);

    return () => socket?.off(event, callback);
  }, [event, callback, socket]);
};

export const useSocketGetQuery = <T,>(
  url: string,
  options?: Omit<QueryOptions<T, Error, T, string[]>, "queryFn">,
) => {
  const { socket } = useSocket();
  const query = useQuery({
    ...options,
    queryKey: ["socket", "get", url],
    queryFn: async () => {
      if (!socket) throw new Error("Socket not initialized");
      const response = await socket.get<T>(url);

      return response.body;
    },
    enabled: !!socket,
  });

  return query;
};
