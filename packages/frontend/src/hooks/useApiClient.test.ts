/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { describe, expect, it } from "vitest";

import { QueryType } from "@/services/types";

import { getApiClientQueryKey } from "./useApiClient";

describe("getApiClientQueryKey", () => {
  it("keeps the legacy key shape for API methods without params", () => {
    expect(getApiClientQueryKey("getCurrentSession")).toEqual([
      QueryType.item,
      "getCurrentSession",
    ]);
  });

  it.each([
    ["getActions", ["manual"], [QueryType.item, "getActions", "manual"]],
    [
      "getFailedWorkflowRunsLast24h",
      [3],
      [QueryType.item, "getFailedWorkflowRunsLast24h", 3],
    ],
    [
      "getMcpTools",
      ["server-id"],
      [QueryType.item, "getMcpTools", "server-id"],
    ],
  ] as const)("includes %s params in the query key", (method, params, key) => {
    expect(getApiClientQueryKey(method, params)).toEqual(key);
  });
});
