/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { useEffect } from "react";

import { useBroadcastChannel } from "@/contexts/broadcast-channel.context";

export const useSubscribeBroadcastChannel: ReturnType<
  typeof useBroadcastChannel
>["subscribe"] = (...props) => {
  const { subscribe } = useBroadcastChannel();

  useEffect(() => {
    subscribe(...props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe]);
};
