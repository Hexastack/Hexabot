/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { describe, expect, it } from "vitest";

import { EntityType } from "@/services/types";
import { SearchPayload } from "@/types/search.types";

import { AssignedTo } from "../types";

import { buildThreadSearchPayload } from "./useInfiniteLiveThreads";

describe("buildThreadSearchPayload", () => {
  it("maps subscriber search fields to thread subscriber filters", () => {
    const payload = {
      where: {
        or: [{ firstName: { contains: "sam" } }, { lastName: { contains: "sam" } }],
      },
    } satisfies SearchPayload<EntityType.SUBSCRIBER>;
    const result = buildThreadSearchPayload(
      {
        channels: ["web"],
        searchPayload: payload,
        assignedTo: AssignedTo.ME,
      },
      "user-1",
    );

    expect(result).toEqual({
      where: {
        or: [
          { "subscriber.firstName": { contains: "sam" } },
          { "subscriber.lastName": { contains: "sam" } },
        ],
        "subscriber.channel.name": { $in: ["web"] },
        "subscriber.assignedTo.id": "user-1",
      },
    });
  });

  it("maps OTHERS assignment filter to not-equal operator", () => {
    const result = buildThreadSearchPayload(
      {
        channels: [],
        searchPayload: { where: {} },
        assignedTo: AssignedTo.OTHERS,
      },
      "user-2",
    );

    expect(result.where).toMatchObject({
      "subscriber.assignedTo.id": {
        "!=": "user-2",
      },
    });
  });
});
