/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { describe, expect, it } from "vitest";

import {
  getActiveThreadId,
  getConversationSourceLabel,
  getConversationSecondaryText,
  getInboxThreadPath,
} from "./ConversationsList";

describe("ConversationsList helpers", () => {
  it("resolves thread id from route params", () => {
    expect(getActiveThreadId("thread-1")).toBe("thread-1");
    expect(getActiveThreadId(["thread-0", "thread-2"])).toBe("thread-2");
    expect(getActiveThreadId(undefined)).toBeNull();
  });

  it("builds the inbox thread route path", () => {
    expect(getInboxThreadPath("thread-9")).toBe("/inbox/threads/thread-9");
  });

  it("formats secondary text with thread title and date", () => {
    expect(
      getConversationSecondaryText("Support discussion", "4/11/2026, 10:52 AM"),
    ).toBe("Support discussion • 4/11/2026, 10:52 AM");
    expect(getConversationSecondaryText(undefined, "4/11/2026, 10:52 AM")).toBe(
      "4/11/2026, 10:52 AM",
    );
  });

  it("prefers source name for conversation badge labels", () => {
    expect(getConversationSourceLabel("main-web", "Unknown")).toBe("main-web");
    expect(getConversationSourceLabel(undefined, "Unknown")).toBe("Unknown");
  });
});
