/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Workflow as WorkflowHelper,
  type ValidateWorkflowOptions,
  type WorkflowDefinition,
  validateWorkflow,
} from "@hexabot-ai/agentic";
import { WorkflowVersionAction } from "@hexabot-ai/types";

type WorkflowDefinitionPersistMode = "debounced" | "immediate";

export type UpdateWorkflowDefinitionStateOptions = {
  persist?: WorkflowDefinitionPersistMode;
};

type CommitWorkflowDefinitionVersion = (payload: {
  action: WorkflowVersionAction;
  definitionYml: string;
}) => void;

type CommitWorkflowDefinitionUpdateArgs = ValidateWorkflowOptions & {
  commitVersion: CommitWorkflowDefinitionVersion;
  definitionYml: string;
  workflowId?: string;
};

type ApplyWorkflowDefinitionStateUpdateArgs = {
  clearDebouncedCommit: () => void;
  commitImmediately: (definitionYml: string) => void;
  currentSignature: string;
  nextDefinition: string | WorkflowDefinition;
  options?: UpdateWorkflowDefinitionStateOptions;
  savedDefinitionYml: string;
  scheduleDebouncedCommit: (definitionYml: string) => void;
  setSignature: (definitionYml: string) => void;
  setYaml: (definitionYml: string) => void;
};

export const stringifyWorkflowDefinitionUpdate = (
  nextDefinition: string | WorkflowDefinition,
) =>
  typeof nextDefinition === "string"
    ? nextDefinition
    : WorkflowHelper.stringifyDefinition(nextDefinition);

export const commitWorkflowDefinitionUpdate = ({
  actions,
  bindingKinds,
  commitVersion,
  definitionYml,
  workflowId,
}: CommitWorkflowDefinitionUpdateArgs) => {
  if (!workflowId) {
    return false;
  }

  const validation = validateWorkflow(definitionYml, {
    actions,
    bindingKinds,
  });

  if (!validation.success) {
    return false;
  }

  commitVersion({
    action: WorkflowVersionAction.update,
    definitionYml,
  });

  return true;
};

export const applyWorkflowDefinitionStateUpdate = ({
  clearDebouncedCommit,
  commitImmediately,
  currentSignature,
  nextDefinition,
  options,
  savedDefinitionYml,
  scheduleDebouncedCommit,
  setSignature,
  setYaml,
}: ApplyWorkflowDefinitionStateUpdateArgs) => {
  const nextSignature = stringifyWorkflowDefinitionUpdate(nextDefinition);
  const persistMode = options?.persist ?? "immediate";
  const hasChanged = currentSignature !== nextSignature;

  if (hasChanged) {
    setSignature(nextSignature);
    setYaml(nextSignature);
  }

  if (persistMode === "debounced") {
    if (hasChanged) {
      scheduleDebouncedCommit(nextSignature);
    }

    return;
  }

  clearDebouncedCommit();

  if (savedDefinitionYml !== nextSignature) {
    commitImmediately(nextSignature);
  }
};
