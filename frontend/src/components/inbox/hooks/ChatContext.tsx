/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
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
