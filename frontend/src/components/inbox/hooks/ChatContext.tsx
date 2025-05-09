/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  Dispatch,
  PropsWithChildren,
  createContext,
  useContext,
  useState,
} from "react";

import { useGet } from "@/hooks/crud/useGet";
import { EntityType, Format } from "@/services/types";
import { ISubscriber } from "@/types/subscriber.types";

import { noop } from "../helpers/noop";

interface IChatContext {
  subscriber: ISubscriber | null;
  setSubscriberId: Dispatch<string | null>;
}

const ChatContext = createContext<IChatContext>({
  subscriber: null,
  setSubscriberId: noop,
});

export const ChatProvider = ({ children }: PropsWithChildren) => {
  const [subscriberId, setSubscriberId] = useState<string | null>(null);
  const { data } = useGet(
    subscriberId === null ? "" : subscriberId,
    {
      entity: EntityType.SUBSCRIBER,
      format: Format.FULL,
    },
    {
      enabled: subscriberId !== null,
    },
  );
  const subscriber = data ? data : null;
  const context = {
    subscriber: subscriberId ? subscriber : null,
    setSubscriberId,
  };

  return (
    <ChatContext.Provider value={context}>{children}</ChatContext.Provider>
  );
};

/**
 *
 * @description this hook is used to get the active chat
 */
export const useChat = () => {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }

  return context;
};
