/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
