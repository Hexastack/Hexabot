/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import * as React from "react";
import { useContext } from "react";

import {
  BroadcastChannelContext,
  BroadcastChannelData,
  IBroadcastChannelContext,
} from "@/contexts/broadcast-channel.context";

export const useBroadcast = <
  T extends BroadcastChannelData = BroadcastChannelData,
>(
  channelName: string,
  handleMessage?: (event: MessageEvent<T>) => void,
  handleMessageError?: (event: MessageEvent<T>) => void,
): ((data: T) => void) => {
  const channelRef = React.useRef<BroadcastChannel | null>(
    typeof window !== "undefined" && "BroadcastChannel" in window
      ? new BroadcastChannel(channelName + "-channel")
      : null,
  );

  useChannelEventListener(channelRef.current, "message", handleMessage);
  useChannelEventListener(
    channelRef.current,
    "messageerror",
    handleMessageError,
  );

  return (data: T) => channelRef.current?.postMessage(data);
};

export const useBroadcastState = <
  T extends BroadcastChannelData = BroadcastChannelData,
>(
  channelName: string,
  initialState: T,
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] => {
  const [isPending, startTransition] = React.useTransition();
  const [state, setState] = React.useState<T>(initialState);
  const broadcast = useBroadcast<T>(channelName, (ev) => setState(ev.data));
  const updateState: React.Dispatch<React.SetStateAction<T>> =
    React.useCallback(
      (input) => {
        setState((prev) => {
          const newState = typeof input === "function" ? input(prev) : input;

          startTransition(() => broadcast(newState));

          return newState;
        });
      },
      [broadcast],
    );

  return [state, updateState, isPending];
};

const useChannelEventListener = <K extends keyof BroadcastChannelEventMap>(
  channel: BroadcastChannel | null,
  event: K,
  handler?: (e: BroadcastChannelEventMap[K]) => void,
) => {
  const callbackRef = React.useRef(handler);

  if (callbackRef.current !== handler) {
    callbackRef.current = handler;
  }

  React.useEffect(() => {
    const callback = callbackRef.current;

    if (!channel || !callback) {
      return;
    }

    channel.addEventListener(event, callback);

    return () => {
      channel.close();
      channel.removeEventListener(event, callback);
    };
  }, [channel, event]);
};

export const useBroadcastChannel = (): IBroadcastChannelContext => {
  const context = useContext(BroadcastChannelContext);

  if (!context) {
    throw new Error(
      "useBroadcastChannel must be used within an BroadcastChannelContext",
    );
  }

  return context;
};
