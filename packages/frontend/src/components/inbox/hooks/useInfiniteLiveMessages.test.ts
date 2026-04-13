/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { describe, expect, it } from "vitest";

import { buildMessageSearchPayload } from "./useInfiniteLiveMessages";

describe("buildMessageSearchPayload", () => {
  it("filters by thread id when active thread exists", () => {
    const payload = buildMessageSearchPayload("thread-1");

    expect(payload).toEqual({
      where: {
        "thread.id": "thread-1",
      },
    });
  });

  it("does not include subscriber based recipient/sender filters", () => {
    const payload = buildMessageSearchPayload(null);

    expect(payload).toEqual({
      where: {},
    });
    expect(payload.where).not.toHaveProperty("or");
    expect(payload.where).not.toHaveProperty("recipient.id");
    expect(payload.where).not.toHaveProperty("sender.id");
  });
});
