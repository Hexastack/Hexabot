/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { useCallback, useMemo } from "react";
import { InfiniteData, useQueryClient } from "react-query";

import { useNormalizeAndCache } from "@/hooks/crud/helpers";
import { useNormalizedInfiniteQuery } from "@/hooks/crud/useNormalizedInfiniteQuery";
import { EntityType, QueryType } from "@/services/types";
import { IMessage } from "@/types/message.types";
import { SearchPayload } from "@/types/search.types";
import { useSubscribe } from "@/websocket/socket-hooks";

import { SocketMessageEvents } from "../types";

import { useChat } from "./ChatContext";

export const useInfinitedLiveMessages = () => {
  const { subscriber: activeChat } = useChat();
  const queryClient = useQueryClient();
  const normalizeAndCache = useNormalizeAndCache(EntityType.MESSAGE);
  const params = useMemo<SearchPayload<IMessage>>(
    () => ({
      where: {
        or: [{ recipient: activeChat?.id }, { sender: activeChat?.id }],
      },
    }),
    [activeChat?.id],
  );
  const {
    data,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
  } = useNormalizedInfiniteQuery(
    {
      entity: EntityType.MESSAGE,
    },
    {
      params,
      initialSortState: [{ field: "createdAt", sort: "desc" }],
    },
    {
      enabled: !!activeChat?.id,
    },
  );
  const addMessage = useCallback(
    (event: SocketMessageEvents) => {
      if (
        (event.op === "messageReceived" || event.op === "messageSent") &&
        event.speakerId === activeChat?.id
      ) {
        const { result } = normalizeAndCache(event.msg);

        queryClient.setQueryData(
          [QueryType.infinite, EntityType.MESSAGE, JSON.stringify(params)],
          (oldData) => {
            if (oldData) {
              const data = oldData as InfiniteData<string[]>;

              return {
                ...data,
                pages: [[result, ...data.pages[0]], ...data.pages.slice(1)],
              };
            }

            return oldData;
          },
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, activeChat?.id],
  );

  useSubscribe<SocketMessageEvents>("message", addMessage);

  const messages = useMemo(() => {
    const seen = new Set<string>();

    return (data?.pages || [])
      .flat()
      .reduce<IMessage[]>((acc, m) => {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          acc.push(m);
        }

        return acc;
      }, [])
      .sort((a, b) => {
        return (
          new Date(a.createdAt ?? 0).getTime() -
          new Date(b.createdAt ?? 0).getTime()
        );
      });
  }, [data]);

  return {
    replyTo:
      data?.pages && data?.pages?.length > 0 ? data?.pages[0][0]?.mid : null,
    messages,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
  };
};
