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
        channel: "console",
      }),
    ).toBe("/webhook/console/");
  });

  it("adds workflow_id query param when workflow id is provided", () => {
    expect(
      buildWebhookUrl({
        channel: "console",
        workflowId: "workflow-id-123",
      }),
    ).toBe("/webhook/console/?workflow_id=workflow-id-123");
  });

  it("preserves existing query params and appends workflow_id", () => {
    expect(
      buildWebhookUrl({
        channel: "console",
        workflowId: "workflow-id-123",
        query: {
          first_name: "John",
          last_name: "Doe",
        },
      }),
    ).toBe(
      "/webhook/console/?first_name=John&last_name=Doe&workflow_id=workflow-id-123",
    );
  });

  it("url-encodes workflow_id value", () => {
    expect(
      buildWebhookUrl({
        channel: "console",
        workflowId: "wf id/1",
      }),
    ).toBe("/webhook/console/?workflow_id=wf+id%2F1");
  });
});
