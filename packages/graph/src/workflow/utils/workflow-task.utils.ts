/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { TaskDefinitions } from "@hexabot-ai/agentic";

export const getTaskDescription = (
  taskName: string,
  tasks?: TaskDefinitions,
): string => {
  return tasks?.[taskName]?.description ?? "No description provided.";
};

export const getTaskAction = (taskName: string, tasks?: TaskDefinitions) => {
  return tasks?.[taskName]?.action;
};
