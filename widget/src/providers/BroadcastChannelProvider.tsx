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
  useRef,
} from "react";

import { generateId } from "../utils/generateId";

export enum EBCEvent {
  LOGOUT = "logout",
}

type BroadcastChannelPayload = {
  event: `${EBCEvent}`;
  data?: string | number | boolean | Record<string, unknown> | undefined | null;
};

export type BroadcastChannelData = {
  tabId: string;
  payload: BroadcastChannelPayload;
};

export interface IBroadcastChannelProps {
  channelName: string;
  children: ReactNode;
}

const getOrCreateTabId = () => {
  let storedTabId = sessionStorage.getItem("tab_uuid");

  if (storedTabId) {
    return storedTabId;
  }

  storedTabId = generateId();
  sessionStorage.setItem("tab_uuid", storedTabId);

  return storedTabId;
};

export interface IBroadcastChannelContext {
  subscribe: (
    event: `${EBCEvent}`,
    callback: (message: BroadcastChannelData) => void,
  ) => void;
  postMessage: (payload: BroadcastChannelPayload) => void;
}

export const BroadcastChannelContext = createContext<
  IBroadcastChannelContext | undefined
>(undefined);

export const BroadcastChannelProvider: FC<IBroadcastChannelProps> = ({
  children,
  channelName,
}) => {
  const channelRef = useRef<BroadcastChannel>(
    new BroadcastChannel(channelName),
  );
  const subscribersRef = useRef<
    Record<string, Array<(message: BroadcastChannelData) => void>>
  >({});
  const tabUuid = getOrCreateTabId();

  useEffect(() => {
    const handleMessage = ({ data }: MessageEvent<BroadcastChannelData>) => {
      const { tabId, payload } = data;

      if (tabId === tabUuid) {
        return;
      }

      subscribersRef.current[payload.event].forEach((callback) =>
        callback(data),
      );
    };

    channelRef.current.addEventListener("message", handleMessage);

    return () => {
      channelRef.current.removeEventListener("message", handleMessage);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      channelRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subscribe: IBroadcastChannelContext["subscribe"] = (
    event,
    callback,
  ) => {
    subscribersRef.current[event] ??= [];
    subscribersRef.current[event].push(callback);

    return () => {
      const index = subscribersRef.current[event].indexOf(callback);

      if (index !== -1) {
        subscribersRef.current[event].splice(index, 1);
      }
    };
  };
  const postMessage: IBroadcastChannelContext["postMessage"] = (payload) => {
    channelRef.current.postMessage({
      tabId: tabUuid,
      payload,
    });
  };

  return (
    <BroadcastChannelContext.Provider
      value={{
        subscribe,
        postMessage,
      }}
    >
      {children}
    </BroadcastChannelContext.Provider>
  );
};

export const useBroadcastChannel = () => {
  const context = useContext(BroadcastChannelContext);

  if (context === undefined) {
    throw new Error(
      "useBroadcastChannel must be used within a BroadcastChannelProvider",
    );
  }

  return context;
};

export default BroadcastChannelProvider;
