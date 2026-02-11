/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useMemo } from "react";

import { useNormalizedInfiniteQuery } from "@/hooks/crud/useNormalizedInfiniteQuery";
import { EntityType } from "@/services/types";
import { IMessage } from "@/types/message.types";
import { SearchPayload } from "@/types/search.types";

import { useChat } from "./ChatContext";

const PAGE_SIZE = 20;

export const useInfinitedLiveMessages = () => {
  const { subscriber: activeChat } = useChat();
  const params = useMemo(
    () =>
      ({
        where: {
          or: activeChat?.id
            ? [
                { "recipient.id": activeChat.id },
                { "sender.id": activeChat.id },
              ]
            : [],
        },
      }) satisfies SearchPayload<EntityType.MESSAGE>,
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
      initialPageParam: {
        limit: PAGE_SIZE,
        skip: 0,
      },
      getNextPageParam: (lastPage, allPages) => {
        if (lastPage.length < PAGE_SIZE) {
          return undefined;
        }

        return {
          limit: PAGE_SIZE,
          skip: allPages.length * PAGE_SIZE,
        };
      },
      enabled: !!activeChat?.id,
    },
  );
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
