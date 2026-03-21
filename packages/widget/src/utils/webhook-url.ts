/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

export const buildWebhookUrl = ({
  channel,
  workflowId,
  query,
}: {
  channel: string;
  workflowId?: string;
  query?: URLSearchParams | Record<string, string>;
}) => {
  const searchParams =
    query instanceof URLSearchParams
      ? new URLSearchParams(query)
      : new URLSearchParams(query);

  if (workflowId) {
    searchParams.set("workflow_id", workflowId);
  }

  const queryString = searchParams.toString();

  return `/webhook/${channel}/${queryString ? `?${queryString}` : ""}`;
};
