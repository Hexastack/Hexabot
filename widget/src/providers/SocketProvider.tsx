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
  useRef,
  useState,
} from 'react';

import { useConfig } from './ConfigProvider';
import { builSocketIoClient, SocketIoClient } from '../utils/SocketIoClient';

interface socketContext {
  socket: SocketIoClient;
  connected: boolean;
}

const socketContext = createContext<socketContext>({
  socket: {} as SocketIoClient,
  connected: false,
});

export const SocketProvider = (props: PropsWithChildren) => {
  const config = useConfig();
  const socketRef = useRef(builSocketIoClient(config));
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socketRef.current.init({
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
  }, []);

  return (
    <socketContext.Provider value={{ socket: socketRef.current, connected }}>
      {props.children}
    </socketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(socketContext);
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

export const useSocketLifecycle = () => {
  const { socket } = useSocket();

  useEffect(() => {
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [socket]);
};
