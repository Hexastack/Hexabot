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
import { useUpdateCache } from "@/hooks/crud/useUpdate";
import { useAuth } from "@/hooks/useAuth";
import { EntityType, QueryType } from "@/services/types";
import { SearchPayload } from "@/types/search.types";
import { ISubscriber } from "@/types/subscriber.types";
import { useSubscribe } from "@/websocket/socket-hooks";

import { AssignedTo, SocketSubscriberEvents } from "../types";

export const useInfiniteLiveSubscribers = (props: {
  channels: string[];
  searchPayload: SearchPayload<ISubscriber>;
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
      // Channel filter using $in operator
      "channel.name": { $in: props.channels },
      // Assignment filter
      ...(props.assignedTo === AssignedTo.ME
        ? { assignedTo: user?.id }
        : props.assignedTo === AssignedTo.OTHERS
        ? {
            assignedTo: {
              "!=": user?.id,
            },
          }
        : {}),
    },
  } satisfies SearchPayload<ISubscriber>;
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
