/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { describe, expect, it } from "vitest";

import { buildWebhookUrl } from "./webhook-url";

describe("buildWebhookUrl", () => {
  it("returns the base webhook URL when workflow id is not provided", () => {
    expect(
      buildWebhookUrl({
        sourceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      }),
    ).toBe("/webhook/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/");
  });

  it("rejects missing source id instead of falling back to channel name", () => {
    expect(() =>
      buildWebhookUrl({
        sourceId: "",
      }),
    ).toThrow("Widget config sourceId is required");
  });

  it("adds workflow_id query param when workflow id is provided", () => {
    expect(
      buildWebhookUrl({
        sourceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        workflowId: "workflow-id-123",
      }),
    ).toBe(
      "/webhook/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/?workflow_id=workflow-id-123",
    );
  });

  it("preserves existing query params and appends workflow_id", () => {
    expect(
      buildWebhookUrl({
        sourceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        workflowId: "workflow-id-123",
        query: {
          first_name: "John",
          last_name: "Doe",
        },
      }),
    ).toBe(
      "/webhook/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/?first_name=John&last_name=Doe&workflow_id=workflow-id-123",
    );
  });

  it("url-encodes workflow_id value", () => {
    expect(
      buildWebhookUrl({
        sourceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        workflowId: "wf id/1",
      }),
    ).toBe(
      "/webhook/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/?workflow_id=wf+id%2F1",
    );
  });
});
