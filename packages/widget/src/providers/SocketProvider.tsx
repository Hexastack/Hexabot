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
  useRef,
} from "react";

import { SocketErrorHandlers } from "../types/message.types";
import { getSocketIoClient, SocketIoClient } from "../utils/SocketIoClient";

import { useConfig } from "./ConfigProvider";

export interface socketContext {
  socket: SocketIoClient;
  socketErrorHandlers?: SocketErrorHandlers;
}

interface SocketProviderProps extends PropsWithChildren {
  socketErrorHandlers?: SocketErrorHandlers;
}

const socketContext = createContext<socketContext>({
  socket: {} as SocketIoClient,
});

export const SocketProvider = ({
  children,
  socketErrorHandlers,
}: SocketProviderProps) => {
  const config = useConfig();
  const socketRef = useRef(
    getSocketIoClient(config, {
      onConnect: () => {
        // eslint-disable-next-line no-console
        console.info(
          "Hexabot Live Chat : Successfully established WS Connection!",
        );
      },
      onConnectError: () => {
        // eslint-disable-next-line no-console
        console.error("Hexabot Live Chat : Failed to establish WS Connection!");
      },
      onDisconnect: () => {
        // eslint-disable-next-line no-console
        console.info("Hexabot Live Chat : Disconnected WS.");
      },
    }),
  );

  return (
    <socketContext.Provider
      value={{ socket: socketRef.current, socketErrorHandlers }}
    >
      {children}
    </socketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(socketContext);
};

export const useSubscribe = <T,>(event: string, callback: (arg: T) => void) => {
  const { socket } = useSocket();

  useEffect(() => {
    socket.on<T>(event, callback);

    return () => socket.off(event, callback);
  }, [event, callback, socket]);
};

export const useSocketLifecycle = () => {
  const { socket } = useSocket();

  useEffect(() => {
    socket.forceReconnect();

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
