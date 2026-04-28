/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  WorkflowDefinition,
  Workflow as WorkflowHelper,
  extractTaskDefinitions,
  type FlowStep,
  type TaskDefinition,
} from "@hexabot-ai/agentic";
import {
  isSameWorkflowSelection,
  type FlowStepPath,
  type WorkflowSelectionSnapshot,
} from "@hexabot-ai/graph";
import debounce from "@mui/utils/debounce";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useFind } from "@/hooks/crud/useFind";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useQueryState } from "@/hooks/useQueryState";
import { useSafeCallback } from "@/hooks/useSafeCallback";
import { EntityType, Format, RouterType } from "@/services/types";
import type { IAction } from "@/types/action.types";
import type { EntityAttributes } from "@/types/base.types";

import { WorkflowContext } from "../contexts/workflow.context";
import { useWorkflowDefinitionState } from "../hooks/useWorkflowDefinitionState";
import type { WorkflowContextProps } from "../types/workflow.types";
import { getSchemaDefaults } from "../utils/schema-defaults.utils";
import {
  createBaseDefinition,
  createTaskName,
  extractTaskIdsFromYaml,
} from "../utils/workflow-definition.utils";

type TaskInputs = NonNullable<TaskDefinition["inputs"]>;
type TaskSettings = NonNullable<TaskDefinition["settings"]>;
type WorkflowAttributes = EntityAttributes<EntityType.WORKFLOW>;
const EMPTY_GRAPH_SELECTION: WorkflowSelectionSnapshot = {
  nodeIds: [],
  nodes: [],
};

export const WorkflowProvider: React.FC<WorkflowContextProps> = ({
  children,
  workflow,
}) => {
  const [flowId] = useQueryState("flowId");
  const { data: workflows } = useFind(
    {
      entity: EntityType.WORKFLOW,
      format: Format.FULL,
    },
    {
      hasCount: false,
      initialSortState: [{ field: "createdAt", sort: "asc" }],
    },
  );
  const router = useAppRouter();
  const directionMemo = useMemo(() => {
    return workflow?.direction;
  }, [flowId, workflow?.direction]);
  const getWorkflowFromCache = useGetFromCache(EntityType.WORKFLOW);
  const [graphSelection, setGraphSelectionState] =
    useState<WorkflowSelectionSnapshot>(EMPTY_GRAPH_SELECTION);
  const selectedNodeIds = graphSelection.nodeIds;
  const [openSearchPanel, setOpenSearchPanel] = useState(false);
  const {
    yaml,
    definition,
    flow,
    definitionErrors,
    updateDefinitionState,
    persistDefinition,
    publishVersion,
    unpublishVersion,
    restoreVersion,
    updateVersionMessage,
    isDefinitionDirty,
    updateWorkflow,
    isSaving,
  } = useWorkflowDefinitionState({
    workflow,
  });
  const taskDefinitions = useMemo(
    () => extractTaskDefinitions(definition?.defs ?? {}),
    [definition?.defs],
  );
  const taskIds = useMemo(() => extractTaskIdsFromYaml(yaml), [yaml]);
  const addActionStep = (action: IAction, insertPath?: FlowStepPath | null) => {
    const baseDefinition = definition ?? createBaseDefinition();
    const nextTaskName = createTaskName(
      action.name,
      baseDefinition.defs ?? {},
      taskDefinitions,
    );
    const taskDescription = action.description?.trim();
    const inputDefaults = getSchemaDefaults<TaskInputs>(action.inputSchema);
    const settingDefaults = getSchemaDefaults<TaskSettings>(
      action.settingSchema,
    )!;
    const nextTaskDefinition: TaskDefinition = {
      kind: "task",
      action: action.name,
      ...(taskDescription ? { description: taskDescription } : {}),
      ...(inputDefaults !== undefined ? { inputs: inputDefaults } : {}),
      ...(settingDefaults !== undefined ? { settings: settingDefaults } : {}),
    };
    const nextDefs = {
      ...baseDefinition.defs,
      [nextTaskName]: nextTaskDefinition,
    };
    const nextOutputs =
      baseDefinition.outputs && Object.keys(baseDefinition.outputs).length > 0
        ? baseDefinition.outputs
        : { result: `=$output.${nextTaskName}` };
    const nextStep: FlowStep = { do: nextTaskName };
    const definitionWithTask: WorkflowDefinition = {
      ...baseDefinition,
      defs: nextDefs,
      outputs: nextOutputs,
    };
    const insertedDefinition = insertPath
      ? WorkflowHelper.insertStepAtPath(
          definitionWithTask,
          insertPath,
          nextStep,
        )
      : null;
    const nextDefinition: WorkflowDefinition = insertedDefinition ?? {
      ...definitionWithTask,
      flow: [...(baseDefinition.flow ?? []), nextStep],
    };

    updateDefinitionState(nextDefinition);
  };
  const addConditionalStep = (insertPath?: FlowStepPath | null) => {
    const baseDefinition = definition ?? createBaseDefinition();
    const conditionalStep: FlowStep = {
      conditional: {
        when: [
          { condition: "=false", steps: [] },
          { else: true, steps: [] },
        ],
      },
    };
    const insertedDefinition = insertPath
      ? WorkflowHelper.insertStepAtPath(
          baseDefinition,
          insertPath,
          conditionalStep,
        )
      : null;
    const nextDefinition: WorkflowDefinition = insertedDefinition ?? {
      ...baseDefinition,
      flow: [...(baseDefinition.flow ?? []), conditionalStep],
    };

    updateDefinitionState(nextDefinition);
  };
  const addLoopStep = (insertPath?: FlowStepPath | null) => {
    const baseDefinition = definition ?? createBaseDefinition();
    const loopStep: FlowStep = {
      loop: {
        type: "for_each",
        for_each: {
          item: "item",
          in: "=[]",
        },
        steps: [],
      },
    };
    const insertedDefinition = insertPath
      ? WorkflowHelper.insertStepAtPath(baseDefinition, insertPath, loopStep)
      : null;
    const nextDefinition: WorkflowDefinition = insertedDefinition ?? {
      ...baseDefinition,
      flow: [...(baseDefinition.flow ?? []), loopStep],
    };

    updateDefinitionState(nextDefinition);
  };
  const addParallelStep = (insertPath?: FlowStepPath | null) => {
    const baseDefinition = definition ?? createBaseDefinition();
    const parallelStep: FlowStep = {
      parallel: {
        strategy: "wait_all",
        steps: [],
      },
    };
    const insertedDefinition = insertPath
      ? WorkflowHelper.insertStepAtPath(
          baseDefinition,
          insertPath,
          parallelStep,
        )
      : null;
    const nextDefinition: WorkflowDefinition = insertedDefinition ?? {
      ...baseDefinition,
      flow: [...(baseDefinition.flow ?? []), parallelStep],
    };

    updateDefinitionState(nextDefinition);
  };
  const getQuery = (key: string): string =>
    typeof router.query[key] === "string" ? router.query[key] : "";
  const updateWorkflowURL = async (flowId: string, nodeIds: string[] = []) => {
    const nodeParams =
      Array.isArray(nodeIds) && nodeIds.length ? `/${nodeIds.join(",")}` : "";

    if (router.pathname.startsWith(`/${RouterType.WORKFLOW_EDITOR}`)) {
      await router.push(
        `/${RouterType.WORKFLOW_EDITOR}/${flowId}${nodeParams}`,
      );
    }
  };
  const removeWorkflowParams = async () => {
    if (flowId) {
      await router.replace(`/${RouterType.WORKFLOW_EDITOR}/${flowId}`);
    }
  };
  const setGraphSelection = useCallback(
    (nextSelection: WorkflowSelectionSnapshot) => {
      if (isSameWorkflowSelection(graphSelection, nextSelection)) {
        return;
      }

      setGraphSelectionState(nextSelection);

      const hasSameNodeIds =
        graphSelection.nodeIds.length === nextSelection.nodeIds.length &&
        graphSelection.nodeIds.every(
          (nodeId, index) => nodeId === nextSelection.nodeIds[index],
        );

      if (flowId && !hasSameNodeIds) {
        void updateWorkflowURL(flowId, nextSelection.nodeIds);
      }
    },
    [flowId, graphSelection, updateWorkflowURL],
  );
  const removeStepAtPath = (stepPath: FlowStepPath, nodeId?: string) => {
    if (!definition) {
      return;
    }

    const nextDefinition = WorkflowHelper.removeStepAtPath(
      definition,
      stepPath,
    );

    if (!nextDefinition) {
      return;
    }

    updateDefinitionState(nextDefinition);

    if (!nodeId || !selectedNodeIds.includes(nodeId)) {
      return;
    }

    const nextSelection = selectedNodeIds.filter(
      (selectedNodeId) => selectedNodeId !== nodeId,
    );

    setGraphSelection({
      nodeIds: nextSelection,
      nodes: graphSelection.nodes.filter(
        (selectedNode) => selectedNode.id !== nodeId,
      ),
    });
  };
  const debouncedWorkflowUpdate = useSafeCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    debounce((props: Partial<WorkflowAttributes>) => {
      if (flowId) {
        updateWorkflow({
          id: flowId,
          params: props,
        });
      }
    }, 400),
    [flowId],
    (memoizedFn) => {
      memoizedFn.clear();
    },
  );

  useEffect(() => {
    if (!flowId && workflows?.length) {
      updateWorkflowURL(workflows[0].id);
    }
  }, [flowId, workflows, updateWorkflowURL]);

  return (
    <WorkflowContext.Provider
      value={{
        getQuery,
        graphSelection,
        openSearchPanel,
        selectedNodeIds,
        getWorkflowFromCache,
        setOpenSearchPanel,
        setGraphSelection,
        selectedFlowId: flowId,
        direction: directionMemo,
        updateWorkflowURL,
        removeWorkflowParams,
        yaml,
        updateDefinitionState,
        workflow,
        workflows,
        updateWorkflow,
        debouncedWorkflowUpdate,
        persistDefinition,
        publishVersion,
        unpublishVersion,
        restoreVersion,
        updateVersionMessage,
        isDefinitionDirty,
        isSaving,
        addActionStep,
        addConditionalStep,
        addLoopStep,
        addParallelStep,
        removeStepAtPath,
        definition,
        flow,
        definitionErrors,
        taskDefinitions,
        taskIds,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};
