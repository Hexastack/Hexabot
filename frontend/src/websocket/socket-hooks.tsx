/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { QueryOptions, useQuery } from "react-query";

import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

import { SocketIoClient, socketIoClient } from "./SocketIoClient";

interface socketContext {
  socket: SocketIoClient;
  connected: boolean;
}

const socketContext = createContext<socketContext>({
  socket: socketIoClient,
  connected: false,
});

export const useSocket = () => {
  return useContext(socketContext);
};

export const SocketProvider = (props: PropsWithChildren) => {
  const { socket } = useSocket();
  const [connected, setConnected] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user)
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
  }, [socket, toast, user]);

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
    socket.on<T>(event, callback);

    return () => socket.off(event, callback);
  }, [event, callback, socket]);
};

export const useSocketGetQuery = <T,>(
  url: string,
  options?: Omit<QueryOptions<T, Error, T, string[]>, "queryFn">,
) => {
  const query = useQuery({
    ...options,
    queryKey: ["socket", "get", url],
    queryFn: async () => {
      const response = await socketIoClient.get<T>(url);

      return response.body;
    },
  });

  return query;
};
