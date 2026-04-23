/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Workflow as WorkflowHelper,
  type WorkflowCompileOptions,
  type WorkflowDefinition,
  validateWorkflow,
} from "@hexabot-ai/agentic";
import { WorkflowVersionAction } from "@hexabot-ai/types";
import type { Workflow } from "@hexabot-ai/types";
import debounce from "@mui/utils/debounce";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useWorkflowActionsCatalog } from "@/contexts/workflow-actions.context";
import { useWorkflowBindingsCatalog } from "@/contexts/workflow-bindings.context";
import { useCreate } from "@/hooks/crud/useCreate";
import { useGetFromCache } from "@/hooks/crud/useGet";
import {
  useTanstackMutation,
  useTanstackQueryClient,
} from "@/hooks/crud/useTanstack";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useApiClient } from "@/hooks/useApiClient";
import { useSafeCallback } from "@/hooks/useSafeCallback";
import { EntityType, QueryType } from "@/services/types";

import { getDefinition } from "../utils/workflow-definition.utils";

type UseWorkflowDefinitionStateArgs = {
  workflow?: Workflow;
};

export const useWorkflowDefinitionState = ({
  workflow,
}: UseWorkflowDefinitionStateArgs) => {
  const { actionsByName } = useWorkflowActionsCatalog();
  const { bindingKinds } = useWorkflowBindingsCatalog();
  const queryClient = useTanstackQueryClient();
  const { apiClient } = useApiClient();
  const { mutate: updateWorkflow } = useUpdate(EntityType.WORKFLOW);
  const { mutate: updateWorkflowVersion, isPending: isUpdatingVersionMessage } =
    useUpdate(EntityType.WORKFLOW_VERSION, {
      routeParams: workflow ? { id: workflow.id } : undefined,
    });
  const updateWorkflowCache = useCallback(
    (updates: Partial<Workflow>) => {
      queryClient.setQueryData(
        [QueryType.item, EntityType.WORKFLOW, workflow?.id],
        (cached?: Workflow) => {
          if (!cached) {
            return workflow ? { ...workflow, ...updates } : cached;
          }

          return {
            ...cached,
            ...updates,
          };
        },
      );
    },
    [queryClient, workflow],
  );
  const { mutate: commitVersion, isPending: isCommitting } = useCreate(
    EntityType.WORKFLOW_VERSION,
    {
      routeParams: { id: workflow?.id },
      onSuccess(data) {
        updateWorkflowCache({
          currentVersion: data.id,
        });
      },
    },
  );
  const { mutate: publish, isPending: isPublishing } = useTanstackMutation<
    Workflow,
    Error,
    void
  >({
    mutationFn: async () => {
      if (!workflow?.id) {
        throw new Error("Workflow ID is required to publish");
      }

      return await apiClient.publishWorkflow(workflow.id);
    },
    onSuccess: (updatedWorkflow) => {
      updateWorkflowCache({
        currentVersion: updatedWorkflow.currentVersion,
        publishedVersion: updatedWorkflow.publishedVersion,
      });
    },
  });
  const { mutate: publishByVersionId, isPending: isPublishingVersion } =
    useTanstackMutation<Workflow, Error, string>({
      mutationFn: async (versionId) => {
        if (!workflow?.id) {
          throw new Error("Workflow ID is required to publish");
        }

        return await apiClient.publishWorkflowVersion(workflow.id, versionId);
      },
      onSuccess: (updatedWorkflow) => {
        updateWorkflowCache({
          currentVersion: updatedWorkflow.currentVersion,
          publishedVersion: updatedWorkflow.publishedVersion,
        });
      },
    });
  const { mutate: unpublish, isPending: isUnpublishing } = useTanstackMutation<
    Workflow,
    Error,
    void
  >({
    mutationFn: async () => {
      if (!workflow?.id) {
        throw new Error("Workflow ID is required to unpublish");
      }

      return await apiClient.unpublishWorkflow(workflow.id);
    },
    onSuccess: (updatedWorkflow) => {
      updateWorkflowCache({
        currentVersion: updatedWorkflow.currentVersion,
        publishedVersion: updatedWorkflow.publishedVersion,
      });
    },
  });
  const getVersionFromCache = useGetFromCache(EntityType.WORKFLOW_VERSION);
  const currentVersion = workflow?.currentVersion
    ? getVersionFromCache(workflow?.currentVersion)
    : null;
  const [yaml, setYaml] = useState(
    currentVersion ? currentVersion.definitionYml : "",
  );
  const compileActionsByName = useMemo(
    () =>
      Array.from(actionsByName.entries()).reduce(
        (acc, [name, action]) => {
          acc[name] =
            action as unknown as WorkflowCompileOptions["actions"][string];

          return acc;
        },
        {} as WorkflowCompileOptions["actions"],
      ),
    [actionsByName],
  );
  const actionValidationMetadata = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(compileActionsByName).map(
          ([actionName, actionDefinition]) => [
            actionName,
            {
              supportedBindings: actionDefinition.supportedBindings ?? [],
            },
          ],
        ),
      ),
    [compileActionsByName],
  );
  const definitionSignatureRef = useRef("");
  const {
    definition,
    flow,
    error: definitionError,
  } = useMemo(() => {
    if (!yaml || actionsByName.size === 0) {
      return { definition: undefined, error: null };
    }

    try {
      const { flow, definition } = getDefinition(yaml, {
        actions: compileActionsByName,
        bindingKinds,
      });

      return {
        definition,
        flow,
        error: null,
      };
    } catch (error) {
      return { definition: undefined, flow: undefined, error: error as Error };
    }
  }, [actionsByName, compileActionsByName, bindingKinds, yaml, workflow?.id]);
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

      const validation = validateWorkflow(nextDefinitionYml, {
        bindingKinds,
        actions: actionValidationMetadata,
      });

      if (!validation.success) {
        return;
      }

      commitVersion({
        action: WorkflowVersionAction.update,
        definitionYml: nextDefinitionYml,
      });
    }, 4000),
    [actionValidationMetadata, bindingKinds, workflow?.id, commitVersion],
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
  const persistDefinition = useCallback(() => {
    if (!workflow?.id || !definition || definitionError || !isDefinitionDirty) {
      return;
    }

    definitionSignatureRef.current =
      WorkflowHelper.stringifyDefinition(definition);
    debouncedDefinitionUpdate.clear();
    commitVersion({
      action: WorkflowVersionAction.update,
      definitionYml: definitionSignatureRef.current,
    });
  }, [
    debouncedDefinitionUpdate,
    definition,
    definitionError,
    workflow?.id,
    isDefinitionDirty,
    commitVersion,
  ]);
  const publishVersion = useCallback(
    (versionId?: string) => {
      if (!workflow?.id) {
        return;
      }

      if (
        versionId &&
        versionId !== workflow.currentVersion &&
        versionId !== workflow.publishedVersion
      ) {
        publishByVersionId(versionId);

        return;
      }

      if (
        !workflow.currentVersion ||
        workflow.currentVersion === workflow.publishedVersion
      ) {
        return;
      }

      publish();
    },
    [
      publish,
      publishByVersionId,
      workflow?.id,
      workflow?.currentVersion,
      workflow?.publishedVersion,
    ],
  );
  const unpublishVersion = useCallback(() => {
    if (!workflow?.id || !workflow.publishedVersion) {
      return;
    }

    unpublish();
  }, [unpublish, workflow?.id, workflow?.publishedVersion]);
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
  const updateVersionMessage = useCallback(
    (versionId: string, message: string) => {
      if (!workflow?.id || !versionId) {
        return;
      }

      updateWorkflowVersion({
        id: versionId,
        params: {
          message,
        },
      });
    },
    [updateWorkflowVersion, workflow?.id],
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
    publishVersion,
    unpublishVersion,
    restoreVersion,
    updateVersionMessage,
    isDefinitionDirty,
    updateWorkflow,
    isSaving:
      isCommitting ||
      isPublishing ||
      isPublishingVersion ||
      isUnpublishing ||
      isUpdatingVersionMessage,
  };
};
