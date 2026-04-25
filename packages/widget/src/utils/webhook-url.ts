/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

export const buildWebhookUrl = ({
  sourceId,
  workflowId,
  query,
}: {
  sourceId: string;
  workflowId?: string;
  query?: URLSearchParams | Record<string, string>;
}) => {
  const resolvedSourceId = sourceId.trim();

  if (!resolvedSourceId) {
    throw new Error("Widget config sourceId is required");
  }

  const searchParams =
    query instanceof URLSearchParams
      ? new URLSearchParams(query)
      : new URLSearchParams(query);

  if (workflowId) {
    searchParams.set("workflow_id", workflowId);
  }

  const queryString = searchParams.toString();

  return `/webhook/${resolvedSourceId}/${queryString ? `?${queryString}` : ""}`;
};
