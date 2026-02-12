/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  WorkflowCompileOptions,
  WorkflowDefinition,
  Workflow as WorkflowHelper,
  type FlowStep,
} from "@hexabot-ai/agentic";
import debounce from "@mui/utils/debounce";
import {
  applyNodeChanges,
  useReactFlow,
  type NodeChange,
  type XYPosition,
} from "@xyflow/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useFind } from "@/hooks/crud/useFind";
import { useGet, useGetFromCache } from "@/hooks/crud/useGet";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useQueryState } from "@/hooks/useQueryState";
import { useSafeCallback } from "@/hooks/useSafeCallback";
import { EntityType, Format, RouterType } from "@/services/types";
import type { IAction } from "@/types/action.types";
import type { IWorkflowAttributes } from "@/types/workfow.types";

import { WorkflowContext } from "../contexts/workflow.context";
import { useWorkflowDefinitionState } from "../hooks/useWorkflowDefinitionState";
import { GraphNode } from "../types/workflow-node.types";
import type { FlowStepPath } from "../types/workflow-path.types";
import type {
  NodeExecutionState,
  WorkflowContextProps,
} from "../types/workflow.types";
import { getSchemaDefaults } from "../utils/schema-defaults.utils";
import {
  createBaseDefinition,
  createTaskName,
} from "../utils/workflow-definition.utils";

type TaskInputs = NonNullable<WorkflowDefinition["tasks"][string]["inputs"]>;
type TaskSettings = NonNullable<
  WorkflowDefinition["tasks"][string]["settings"]
>;

export const WorkflowProvider: React.FC<WorkflowContextProps> = ({
  children,
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
  const { data: workflow } = useGet(
    flowId || "",
    {
      entity: EntityType.WORKFLOW,
      format: Format.FULL,
    },
    {
      enabled: !!flowId,
    },
  );
  const { data: actions } = useFind(
    { entity: EntityType.WORKFLOW_ACTIONS },
    { hasCount: false },
    {
      routeParams: workflow?.type ? { type: workflow?.type } : undefined,
      enabled: !!workflow?.type,
    },
  );
  const router = useAppRouter();
  const directionMemo = useMemo(() => {
    return workflow?.direction;
  }, [flowId, workflow?.direction]);
  const { screenToFlowPosition, getNodes, setNodes } =
    useReactFlow<GraphNode>();
  const [executionStates, setExecutionStates] = useState<
    Record<string, { state: NodeExecutionState; t: number }[]>
  >({});
  const getWorkflowFromCache = useGetFromCache(EntityType.WORKFLOW);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [openSearchPanel, setOpenSearchPanel] = useState(false);
  const [toFocusIds, setToFocusIds] = useState<string[]>([]);
  const getCentroid = (): XYPosition => {
    if (typeof window === "undefined") return { x: 0, y: 0 };
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const screenCenter = {
      x: screenWidth / 2,
      y: screenHeight / 2,
    };

    return screenToFlowPosition(screenCenter);
  };
  // Cache the action map by content signature to avoid re-parsing on each render.
  const actionsSignature = useMemo(
    () =>
      actions
        .map(
          (action) => `${action.id}:${action.name}:${action.updatedAt ?? ""}`,
        )
        .sort()
        .join("|"),
    [actions],
  );
  const actionsSignatureRef = useRef("");
  const actionsByNameRef = useRef<WorkflowCompileOptions["actions"]>(
    {} as WorkflowCompileOptions["actions"],
  );

  if (actionsSignatureRef.current !== actionsSignature) {
    actionsSignatureRef.current = actionsSignature;
    actionsByNameRef.current = actions.reduce(
      (acc, cur) => {
        acc[cur.name] =
          cur as unknown as WorkflowCompileOptions["actions"][string];

        return acc;
      },
      {} as WorkflowCompileOptions["actions"],
    );
  }

  const actionsByName = actionsByNameRef.current;
  const hasActions = actions.length > 0;
  const {
    yaml,
    definition,
    flow,
    updateDefinitionState,
    persistDefinition,
    restoreVersion,
    isDefinitionDirty,
    updateWorkflow,
    isSaving,
  } = useWorkflowDefinitionState({
    workflow,
    actionsByName,
    hasActions,
  });
  const addActionStep = (action: IAction, insertPath?: FlowStepPath | null) => {
    const baseDefinition = definition ?? createBaseDefinition();
    const nextTaskName = createTaskName(
      action.name,
      baseDefinition.tasks ?? {},
    );
    const taskDescription = action.description?.trim();
    const inputDefaults = getSchemaDefaults<TaskInputs>(action.inputSchema);
    const settingDefaults = getSchemaDefaults<TaskSettings>(
      action.settingSchema,
    );
    const nextTasks = {
      ...baseDefinition.tasks,
      [nextTaskName]: {
        action: action.name,
        ...(taskDescription ? { description: taskDescription } : {}),
        ...(inputDefaults !== undefined ? { inputs: inputDefaults } : {}),
        ...(settingDefaults !== undefined ? { settings: settingDefaults } : {}),
      },
    };
    const nextOutputs =
      baseDefinition.outputs && Object.keys(baseDefinition.outputs).length > 0
        ? baseDefinition.outputs
        : { result: `=$output.${nextTaskName}` };
    const nextStep: FlowStep = { do: nextTaskName };
    const definitionWithTask: WorkflowDefinition = {
      ...baseDefinition,
      tasks: nextTasks,
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
  const selectNodes = (nodeIds: string[]): void => {
    setSelectedNodeIds(nodeIds);
    const changes = getNodes().map(({ id }) => ({
      id,
      type: "select",
      selected: nodeIds.includes(id),
    })) as NodeChange<GraphNode>[];

    setNodes((nodes) => applyNodeChanges<GraphNode>(changes, nodes));
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

    selectNodes(nextSelection);

    if (flowId) {
      updateWorkflowURL(flowId, nextSelection);
    }
  };
  const debouncedWorkflowUpdate = useSafeCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    debounce((props: Partial<IWorkflowAttributes>) => {
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
        toFocusIds,
        selectNodes,
        getCentroid,
        setToFocusIds,
        openSearchPanel,
        selectedNodeIds,
        getWorkflowFromCache,
        setOpenSearchPanel,
        setSelectedNodeIds,
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
        executionStates,
        setExecutionStates,
        updateDefinition: updateDefinitionState,
        persistDefinition,
        restoreVersion,
        isDefinitionDirty,
        isSaving,
        addActionStep,
        addConditionalStep,
        removeStepAtPath,
        actions,
        definition,
        flow,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};
