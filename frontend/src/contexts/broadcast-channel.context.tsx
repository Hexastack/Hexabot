/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

import { useTabUuid } from "@/hooks/useTabUuid";

export type BroadcastChannelData = {
  tabId: string;
  data: string | number | boolean | Record<string, unknown> | undefined | null;
};

export interface IBroadcastChannelProps {
  channelName: string;
  children?: ReactNode;
}

export const BroadcastChannelContext = createContext<{
  subscribers: ((message: BroadcastChannelData) => void)[];
  subscribe: (callback: (message: BroadcastChannelData) => void) => () => void;
  postMessage: (message: BroadcastChannelData) => void;
}>({
  subscribers: [],
  subscribe: () => () => {},
  postMessage: () => {},
});

export const BroadcastChannelProvider: FC<IBroadcastChannelProps> = ({
  channelName,
  children,
}) => {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const subscribersRef = useRef<Array<(message: BroadcastChannelData) => void>>(
    [],
  );
  const tabUuidRef = useTabUuid();

  useEffect(() => {
    const channel = new BroadcastChannel(channelName);

    channelRef.current = channel;

    const handleMessage = (event: MessageEvent) => {
      const { tabId, data } = event.data;

      if (tabId === tabUuidRef.current) return;

      subscribersRef.current.forEach((callback) => callback(data));
    };

    channel.addEventListener("message", handleMessage);

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
    };
  }, [channelName, tabUuidRef]);

  const postMessage = (message: BroadcastChannelData) => {
    channelRef.current?.postMessage({
      tabId: tabUuidRef.current,
      data: message,
    });
  };
  const subscribe = (callback: (message: BroadcastChannelData) => void) => {
    subscribersRef.current.push(callback);

    return () => {
      const index = subscribersRef.current.indexOf(callback);

      if (index !== -1) {
        subscribersRef.current.splice(index, 1);
      }
    };
  };
  const contextValue = useMemo(
    () => ({
      subscribers: subscribersRef.current,
      subscribe,
      postMessage,
    }),
    [],
  );

  return (
    <BroadcastChannelContext.Provider value={contextValue}>
      {children}
    </BroadcastChannelContext.Provider>
  );
};

export default BroadcastChannelProvider;

export const useBroadcastChannel = () => {
  const context = useContext(BroadcastChannelContext);

  if (context === undefined) {
    throw new Error(
      "useBroadcastChannel must be used within a BroadcastChannelProvider",
    );
  }

  return context;
};
