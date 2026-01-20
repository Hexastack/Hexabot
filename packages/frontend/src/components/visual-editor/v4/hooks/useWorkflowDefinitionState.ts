/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  type WorkflowCompileOptions,
  type WorkflowDefinition,
  Workflow as WorkflowHelper,
} from "@hexabot-ai/agentic";
import debounce from "@mui/utils/debounce";
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useSafeCallback } from "@/hooks/useSafeCallback";
import type { IWorkflow, IWorkflowAttributes } from "@/types/workfow.types";

import { getDefinition } from "../utils/workflow-node.utils";

type UpdateWorkflow = (payload: {
  id: string;
  params: Partial<IWorkflowAttributes>;
}) => void;

type UseWorkflowDefinitionStateArgs = {
  flowId?: string;
  workflow?: IWorkflow;
  actionsByName: WorkflowCompileOptions["actions"];
  hasActions: boolean;
  updateWorkflow: UpdateWorkflow;
};

type UseWorkflowDefinitionStateResult = {
  yaml: string;
  setYaml: Dispatch<SetStateAction<string>>;
  definition?: WorkflowDefinition;
  updateDefinition: (nextDefinition: WorkflowDefinition) => void;
};

export const useWorkflowDefinitionState = ({
  flowId,
  workflow,
  actionsByName,
  hasActions,
  updateWorkflow,
}: UseWorkflowDefinitionStateArgs): UseWorkflowDefinitionStateResult => {
  const [yaml, setYaml] = useState("");
  const definitionSignatureRef = useRef("");
  const definitionResult = useMemo(() => {
    if (!yaml || !hasActions) {
      return { definition: undefined, error: null };
    }

    try {
      return {
        definition: getDefinition(yaml, {
          actions: actionsByName,
        }),
        error: null,
      };
    } catch (error) {
      return { definition: undefined, error: error as Error };
    }
  }, [actionsByName, hasActions, yaml]);
  const definition = definitionResult.definition;
  const definitionError = definitionResult.error;
  const updateDefinition = (nextDefinition: WorkflowDefinition) => {
    setYaml(WorkflowHelper.stringifyDefinition(nextDefinition));
  };
  const debouncedDefinitionUpdate = useSafeCallback(
    debounce((nextDefinition: WorkflowDefinition) => {
      if (!flowId) {
        return;
      }

      updateWorkflow({
        id: flowId,
        params: {
          definition: nextDefinition,
        },
      });
    }, 400),
    [flowId, updateWorkflow],
    (memoizedFn) => {
      memoizedFn.clear();
    },
  );

  useEffect(() => {
    const nextYaml =
      workflow?.definitionYaml ??
      (workflow?.definition
        ? WorkflowHelper.stringifyDefinition(workflow.definition)
        : "");

    definitionSignatureRef.current = nextYaml;
    setYaml(nextYaml);
  }, [workflow?.definition, workflow?.definitionYaml, workflow?.id]);
  useEffect(() => {
    if (!flowId || !definition || definitionError) {
      return;
    }

    const nextSignature = WorkflowHelper.stringifyDefinition(definition);

    if (definitionSignatureRef.current === nextSignature) {
      return;
    }

    definitionSignatureRef.current = nextSignature;
    debouncedDefinitionUpdate(definition);
  }, [debouncedDefinitionUpdate, definition, definitionError, flowId]);
  useEffect(() => {
    if (!definitionError) {
      return;
    }

    // eslint-disable-next-line no-console
    console.error("Failed to parse workflow definition:", definitionError);
  }, [definitionError]);

  return {
    yaml,
    setYaml,
    definition,
    updateDefinition,
  };
};
