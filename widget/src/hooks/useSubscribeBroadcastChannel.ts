/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useEffect } from "react";

import { useBroadcastChannel } from "../providers/BroadcastChannelProvider";

export const useSubscribeBroadcastChannel: ReturnType<
  typeof useBroadcastChannel
>["subscribe"] = (...props) => {
  const { subscribe, unsubscribe } = useBroadcastChannel();

  useEffect(() => {
    subscribe(...props);

    return () => {
      unsubscribe(...props);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe]);
};
