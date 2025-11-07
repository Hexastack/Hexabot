/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useCallback, useMemo } from "react";
import { InfiniteData, useQueryClient } from "react-query";

import { useNormalizeAndCache } from "@/hooks/crud/helpers";
import { useNormalizedInfiniteQuery } from "@/hooks/crud/useNormalizedInfiniteQuery";
import { useUpdateCache } from "@/hooks/crud/useUpdate";
import { useAuth } from "@/hooks/useAuth";
import { EntityType, QueryType } from "@/services/types";
import { SearchPayload } from "@/types/search.types";
import { useSubscribe } from "@/websocket/socket-hooks";

import { AssignedTo, SocketSubscriberEvents } from "../types";

export const useInfiniteLiveSubscribers = (props: {
  channels: string[];
  searchPayload: SearchPayload<EntityType.SUBSCRIBER>;
  assignedTo: AssignedTo;
}) => {
  const { user } = useAuth();
  const updateCachedSubscriber = useUpdateCache(EntityType.SUBSCRIBER);
  const normalizeAndCache = useNormalizeAndCache(EntityType.SUBSCRIBER);
  const queryClient = useQueryClient();
  const params = {
    where: {
      // Firstname and lastname keyword search
      ...props.searchPayload.where,
      // TODO: need to support $in operator for partial filter plain object field
      // Channel filter using $in operator
      "channel.name": { $in: props.channels },
      // Assignment filter
      ...(props.assignedTo === AssignedTo.ME
        ? { "assignedTo.id": user?.id }
        : props.assignedTo === AssignedTo.OTHERS
          ? {
              "assignedTo.id": {
                "!=": user?.id,
              },
            }
          : {}),
    },
  } satisfies SearchPayload<EntityType.SUBSCRIBER>;
  const {
    data,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
    isLoading,
    isFetching,
  } = useNormalizedInfiniteQuery(
    { entity: EntityType.SUBSCRIBER },
    {
      params,
      initialSortState: [
        {
          field: "lastvisit",
          sort: "desc",
        },
      ],
    },
  );
  const handleSubscriberEvent = useCallback(
    (event: SocketSubscriberEvents) => {
      if (event.op === "newSubscriber") {
        const { result } = normalizeAndCache(event.profile);

        // Only update the unfiltered (all-subscribers) cache
        queryClient.setQueryData(
          [
            QueryType.infinite,
            EntityType.SUBSCRIBER,
            JSON.stringify({ where: {} }),
          ],
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
      } else if (event.op === "updateSubscriber") {
        updateCachedSubscriber({
          id: event.profile.id,
          payload: event.profile,
          strategy: "overwrite",
        });
      }
    },
    [queryClient, normalizeAndCache, updateCachedSubscriber],
  );

  useSubscribe<SocketSubscriberEvents>("subscriber", handleSubscriberEvent);

  const subscribers = useMemo(
    () =>
      (data?.pages || [])
        .flat()
        .filter((m, idx, self) => self.indexOf(m) === idx),
    [data],
  );

  return {
    subscribers,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    hasNextPage,
  };
};
