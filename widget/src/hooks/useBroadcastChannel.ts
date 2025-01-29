/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import * as React from "react";

export type BroadcastChannelData = {
  uuid: string;
  value: string | number | boolean | Record<string, unknown> | undefined | null;
};

/**
 * React hook to create and manage a Broadcast Channel across multiple browser windows.
 *
 * @param channelName Static name of channel used across the browser windows.
 * @param handleMessage Callback to handle the event generated when `message` is received.
 * @param handleMessageError [optional] Callback to handle the event generated when `error` is received.
 * @returns A function to send/post message on the channel.
 */
export function useBroadcastChannel<
  T extends BroadcastChannelData = BroadcastChannelData,
>(
  channelName: string,
  handleMessage?: (event: MessageEvent<T>) => void,
  handleMessageError?: (event: MessageEvent<T>) => void,
): (data: T) => void {
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
}

/**
 * React hook to manage state across browser windows. Has the similar signature as `React.useState`.
 *
 * @param channelName Static name of channel used across the browser windows.
 * @param initialState Initial state.
 * @returns Tuple of state and setter for the state.
 */
export function useBroadcastState<
  T extends BroadcastChannelData = BroadcastChannelData,
>(
  channelName: string,
  initialState: T,
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [isPending, startTransition] = React.useTransition();
  const [state, setState] = React.useState<T>(initialState);
  const broadcast = useBroadcastChannel<T>(channelName, (ev) =>
    setState(ev.data),
  );
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
}

// Helpers

/** Hook to subscribe/unsubscribe from channel events. */
function useChannelEventListener<K extends keyof BroadcastChannelEventMap>(
  channel: BroadcastChannel | null,
  event: K,
  handler?: (e: BroadcastChannelEventMap[K]) => void,
) {
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
}
