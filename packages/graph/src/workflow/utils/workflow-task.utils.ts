/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  isTaskDefinition,
  type DefDefinitions,
  type TaskDefinition,
} from "@hexabot-ai/agentic";

const getTaskDefinition = (
  taskName: string,
  defs?: DefDefinitions,
): TaskDefinition | undefined => {
  const definition = defs?.[taskName];

  if (!definition || !isTaskDefinition(definition)) {
    return undefined;
  }

  return definition;
};

export const getTaskDescription = (
  taskName: string,
  defs?: DefDefinitions,
): string => {
  return (
    getTaskDefinition(taskName, defs)?.description ?? "No description provided."
  );
};

export const getTaskAction = (taskName: string, defs?: DefDefinitions) => {
  return getTaskDefinition(taskName, defs)?.action;
};
