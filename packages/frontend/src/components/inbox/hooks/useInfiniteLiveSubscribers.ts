/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useMemo } from "react";

import { useNormalizedInfiniteQuery } from "@/hooks/crud/useNormalizedInfiniteQuery";
import { useAuth } from "@/hooks/useAuth";
import { EntityType } from "@/services/types";
import { SearchPayload } from "@/types/search.types";

import { AssignedTo } from "../types";

export const useInfiniteLiveSubscribers = (props: {
  channels: string[];
  searchPayload: SearchPayload<EntityType.SUBSCRIBER>;
  assignedTo: AssignedTo;
}) => {
  const { user } = useAuth();
  // const updateCachedSubscriber = useUpdateCache(EntityType.SUBSCRIBER);
  // const normalizeAndCache = useNormalizeAndCache(EntityType.SUBSCRIBER);
  // const queryClient = useTanstackQueryClient();
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
