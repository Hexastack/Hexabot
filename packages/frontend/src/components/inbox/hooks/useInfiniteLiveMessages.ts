/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Message } from "@hexabot-ai/types";
import { useMemo } from "react";

import { useNormalizedInfiniteQuery } from "@/hooks/crud/useNormalizedInfiniteQuery";
import { EntityType } from "@/services/types";
import { SearchPayload } from "@/types/search.types";

import { useChat } from "./ChatContext";

const PAGE_SIZE = 20;

export const buildMessageSearchPayload = (activeThreadId: string | null) => {
  return {
    where: {
      ...(activeThreadId ? { "thread.id": activeThreadId } : {}),
    },
  } satisfies SearchPayload<EntityType.MESSAGE>;
};

export const useInfinitedLiveMessages = () => {
  const { thread } = useChat();
  const activeThreadId = thread?.id ?? null;
  const params = useMemo(
    () => buildMessageSearchPayload(activeThreadId),
    [activeThreadId],
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
      enabled: !!activeThreadId,
    },
  );
  const messages = useMemo(() => {
    const seen = new Set<string>();

    return (data?.pages || [])
      .flat()
      .reduce<Message[]>((acc, m) => {
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
    activeThreadId,
    messages,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
  };
};
