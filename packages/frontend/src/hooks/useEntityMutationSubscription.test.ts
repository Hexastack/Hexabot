/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { describe, expect, it } from "vitest";

import { EntityType, QueryType } from "@/services/types";

import {
  isThreadInfiniteQuery,
  mergeEntityCachePayload,
} from "./useEntityMutationSubscription";

describe("useEntityMutationSubscription helpers", () => {
  it("keeps populated thread subscriber when incoming payload has a subscriber id", () => {
    const previousData = {
      id: "thread-1",
      title: "Support",
      subscriber: { id: "sub-1", fullName: "Subscriber One" },
    };
    const nextEntityData = {
      id: "thread-1",
      status: "open",
      subscriber: "sub-1",
    };
    const merged = mergeEntityCachePayload(
      EntityType.THREAD,
      previousData,
      nextEntityData,
    );

    expect(merged.subscriber).toEqual(previousData.subscriber);
    expect(merged.status).toBe("open");
  });

  it("matches only infinite thread query keys for refetch", () => {
    expect(
      isThreadInfiniteQuery([QueryType.infinite, EntityType.THREAD, "{}"]),
    ).toBe(true);
    expect(
      isThreadInfiniteQuery([QueryType.collection, EntityType.THREAD, "{}"]),
    ).toBe(false);
    expect(
      isThreadInfiniteQuery([QueryType.infinite, EntityType.MESSAGE, "{}"]),
    ).toBe(false);
  });
});
