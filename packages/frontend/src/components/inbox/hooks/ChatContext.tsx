/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ThreadFull } from "@hexabot-ai/types";
import {
  Dispatch,
  PropsWithChildren,
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

import { useGet } from "@/hooks/crud/useGet";
import { EntityType, Format } from "@/services/types";
import { Subscriber } from "@/types/subscriber.types";

import { noop } from "../helpers/noop";

interface IChatContext {
  thread: ThreadFull | null;
  subscriber: Subscriber | null;
  setThreadId: Dispatch<string | null>;
}

const ChatContext = createContext<IChatContext>({
  thread: null,
  subscriber: null,
  setThreadId: noop,
});

export const ChatProvider = ({ children }: PropsWithChildren) => {
  const [threadId, setThreadId] = useState<string | null>(null);
  const { data: threadData } = useGet(
    threadId === null ? "" : threadId,
    {
      entity: EntityType.THREAD,
      format: Format.FULL,
    },
    {
      enabled: threadId !== null,
    },
  );
  const thread = (
    threadId && threadData ? threadData : null
  ) as ThreadFull | null;
  const subscriberId = useMemo(() => {
    if (!thread?.subscriber) {
      return null;
    }

    if (typeof thread.subscriber === "string") {
      return thread.subscriber;
    }

    if (
      typeof thread.subscriber === "object" &&
      "id" in thread.subscriber &&
      typeof thread.subscriber.id === "string"
    ) {
      return thread.subscriber.id;
    }

    return null;
  }, [thread?.subscriber]);
  const { data: subscriberData } = useGet(
    subscriberId ?? "",
    {
      entity: EntityType.SUBSCRIBER,
      format: Format.FULL,
    },
    {
      enabled: Boolean(subscriberId),
    },
  );
  const subscriber =
    subscriberData ||
    (thread?.subscriber && typeof thread.subscriber !== "string"
      ? thread.subscriber
      : null);
  const context = {
    thread,
    subscriber,
    setThreadId,
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
