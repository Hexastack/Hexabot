/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  type WorkflowCompileOptions,
  type WorkflowDefinition,
  Workflow as WorkflowHelper,
  validateWorkflow,
} from "@hexabot-ai/agentic";
import debounce from "@mui/utils/debounce";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useCreate } from "@/hooks/crud/useCreate";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useTanstackQueryClient } from "@/hooks/crud/useTanstack";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useSafeCallback } from "@/hooks/useSafeCallback";
import { EntityType, QueryType } from "@/services/types";
import { WorkflowVersionAction } from "@/types/workfow-version.types";
import type { IWorkflow } from "@/types/workfow.types";

import { getDefinition } from "../utils/workflow-node.utils";

type UseWorkflowDefinitionStateArgs = {
  workflow?: IWorkflow;
  actionsByName: WorkflowCompileOptions["actions"];
  hasActions: boolean;
};

export const useWorkflowDefinitionState = ({
  workflow,
  actionsByName,
  hasActions,
}: UseWorkflowDefinitionStateArgs) => {
  const queryClient = useTanstackQueryClient();
  const { mutate: updateWorkflow } = useUpdate(EntityType.WORKFLOW);
  const { mutate: commitVersion, isPending: isSaving } = useCreate(
    EntityType.WORKFLOW_VERSION,
    {
      routeParams: { id: workflow?.id },
      onSuccess(data, variables) {
        const isPublish = variables?.action === WorkflowVersionAction.publish;

        queryClient.setQueryData(
          [QueryType.item, EntityType.WORKFLOW, workflow?.id],
          (cached?: IWorkflow) => {
            if (!cached) {
              return workflow
                ? {
                    ...workflow,
                    currentVersion: data.id,
                    ...(isPublish ? { publishedVersion: data.id } : {}),
                  }
                : cached;
            }

            return {
              ...cached,
              currentVersion: data.id,
              ...(isPublish ? { publishedVersion: data.id } : {}),
            };
          },
        );
      },
    },
  );
  const getVersionFromCache = useGetFromCache(EntityType.WORKFLOW_VERSION);
  const currentVersion = workflow?.currentVersion
    ? getVersionFromCache(workflow?.currentVersion)
    : null;
  const [yaml, setYaml] = useState(
    currentVersion ? currentVersion.definitionYml : "",
  );
  const definitionSignatureRef = useRef("");
  const {
    definition,
    flow,
    error: definitionError,
  } = useMemo(() => {
    if (!yaml || !hasActions) {
      return { definition: undefined, error: null };
    }

    try {
      const { flow, definition } = getDefinition(yaml, {
        actions: actionsByName,
      });

      return {
        definition,
        flow,
        error: null,
      };
    } catch (error) {
      return { definition: undefined, flow: undefined, error: error as Error };
    }
  }, [actionsByName, hasActions, yaml, workflow?.id]);
  // New definition version not yet saved ?
  const isDefinitionDirty = useMemo(() => {
    if (workflow?.currentVersion && !currentVersion) {
      return false;
    }

    const baseline = currentVersion?.definitionYml ?? "";

    return baseline !== yaml;
  }, [currentVersion?.definitionYml, workflow?.currentVersion, yaml]);
  // Commit new definition version
  const debouncedDefinitionUpdate = useSafeCallback(
    debounce((nextDefinitionYml: string) => {
      if (!workflow?.id) {
        return;
      }

      const validation = validateWorkflow(nextDefinitionYml);

      if (!validation.success) {
        return;
      }

      commitVersion({
        action: WorkflowVersionAction.update,
        definitionYml: nextDefinitionYml,
      });
    }, 4000),
    [workflow?.id, commitVersion],
    (memoizedFn) => {
      memoizedFn.clear();
    },
  );
  // Update local YML stae
  const updateDefinitionState = useCallback(
    (nextDefinition: string | WorkflowDefinition) => {
      const nextSignature =
        typeof nextDefinition === "string"
          ? nextDefinition
          : WorkflowHelper.stringifyDefinition(nextDefinition);

      if (definitionSignatureRef.current === nextSignature) {
        return;
      }

      definitionSignatureRef.current = nextSignature;

      setYaml(nextSignature);
      debouncedDefinitionUpdate(nextSignature);
    },
    [debouncedDefinitionUpdate],
  );
  // Immediate commit of the definition version
  const persistDefinition = useCallback(
    (action: WorkflowVersionAction = WorkflowVersionAction.update) => {
      if (!workflow?.id || !definition || definitionError) {
        return;
      }

      const shouldPersist =
        action === WorkflowVersionAction.publish || isDefinitionDirty;

      if (!shouldPersist) {
        return;
      }

      definitionSignatureRef.current =
        WorkflowHelper.stringifyDefinition(definition);
      debouncedDefinitionUpdate.clear();
      commitVersion({
        action,
        definitionYml: definitionSignatureRef.current,
        parentVersion:
          action === WorkflowVersionAction.publish ? currentVersion?.id : null,
      });
    },
    [
      debouncedDefinitionUpdate,
      definition,
      definitionError,
      workflow?.id,
      isDefinitionDirty,
      commitVersion,
      currentVersion?.id,
    ],
  );
  const restoreVersion = useCallback(
    (parentVersion: string, definitionYml: string) => {
      if (!workflow?.id || !parentVersion || !definitionYml) {
        return;
      }

      debouncedDefinitionUpdate.clear();
      commitVersion({
        action: WorkflowVersionAction.restore,
        definitionYml,
        parentVersion,
      });
    },
    [debouncedDefinitionUpdate, workflow?.id, commitVersion],
  );

  useEffect(() => {
    const nextYaml = currentVersion?.definitionYml ?? "";

    definitionSignatureRef.current = nextYaml;
    setYaml(nextYaml);
  }, [currentVersion, workflow?.id]);

  useEffect(() => {
    if (!definitionError) {
      return;
    }

    // eslint-disable-next-line no-console
    console.error("Failed to parse workflow definition:", definitionError);
  }, [definitionError]);

  return {
    yaml,
    definition,
    flow,
    updateDefinitionState,
    persistDefinition,
    restoreVersion,
    isDefinitionDirty,
    updateWorkflow,
    isSaving,
  };
};
