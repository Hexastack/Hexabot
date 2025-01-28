/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { useEffect, useRef, useState } from "react";

export enum ETabMode {
  PRIMARY = "primary",
  SECONDARY = "secondary",
}

export enum EBCEvent {
  LOGOUT_END_SESSION = "logout-end-session",
}

export const useBroadcastChannel = (
  channelName: string = "main-broadcast-channel",
  initialValue?: EBCEvent,
) => {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const [value, setValue] = useState<EBCEvent | undefined>(initialValue);
  const [mode, setMode] = useState<ETabMode>(ETabMode.PRIMARY);

  useEffect(() => {
    channelRef.current = new BroadcastChannel(channelName);
  }, [channelName]);

  useEffect(() => {
    if (channelRef.current) {
      channelRef.current.addEventListener("message", (event) => {
        if (mode === ETabMode.PRIMARY) {
          setValue(event.data);
          setMode(ETabMode.SECONDARY);
        }
      });
      channelRef.current.postMessage(initialValue);
    }

    return () => {
      if (channelRef.current?.onmessage) {
        channelRef.current.onmessage = null;
      }
      channelRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, initialValue]);

  const send = (data: EBCEvent) => {
    channelRef.current?.postMessage(data);
  };

  return { mode, value, send };
};
