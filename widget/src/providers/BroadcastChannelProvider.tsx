/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { createContext, ReactNode } from "react";

import { useBroadcast } from "../hooks/useBroadcastChannel";

export interface IBroadcastChannelContext {
  useBroadcast: (
    channelName: string,
    handleMessage?: (event: MessageEvent<BroadcastChannelData>) => void,
    handleMessageError?: (event: MessageEvent<BroadcastChannelData>) => void,
  ) => (data: BroadcastChannelData) => void;
}

export type BroadcastChannelData = {
  uuid: string;
  value: string | number | boolean | Record<string, unknown> | undefined | null;
};

export interface IBroadcastChannelProps {
  children?: ReactNode;
}

export const BroadcastChannelContext = createContext<IBroadcastChannelContext>({
  useBroadcast: () => () => {},
});

export const BroadcastChannelProvider: React.FC<IBroadcastChannelProps> = ({
  // eslint-disable-next-line react/prop-types
  children,
}) => {
  return (
    <BroadcastChannelContext.Provider
      value={{
        useBroadcast,
      }}
    >
      {children}
    </BroadcastChannelContext.Provider>
  );
};

export default BroadcastChannelProvider;
