/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  WorkflowCompileOptions,
  WorkflowDefinition,
  WorkflowEventMap,
  Workflow as WorkflowHelper,
  type FlowStep,
} from "@hexabot-ai/agentic";
import debounce from "@mui/utils/debounce";
import {
  applyNodeChanges,
  useReactFlow,
  type Node,
  type NodeChange,
  type XYPosition,
} from "@xyflow/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useFind } from "@/hooks/crud/useFind";
import { useGet, useGetFromCache } from "@/hooks/crud/useGet";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useQueryChange } from "@/hooks/useQueryChange";
import { useSafeCallback } from "@/hooks/useSafeCallback";
import { EntityType, RouterType } from "@/services/types";
import type { IAction } from "@/types/action.types";
import type { IWorkflowAttributes } from "@/types/workfow.types";
import { useSubscribe } from "@/websocket/socket-hooks";

import { WorkflowContext } from "../contexts/workflow.context";
import { useWorkflowDefinitionState } from "../hooks/useWorkflowDefinitionState";
import type { FlowStepPath } from "../types/workflow-path.types";
import type { WorkflowContextProps } from "../types/workflow.types";
import {
  createBaseDefinition,
  createTaskName,
} from "../utils/workflow-definition.utils";

export const WorkflowProvider: React.FC<WorkflowContextProps> = ({
  children,
}) => {
  const { data: actions } = useFind(
    { entity: EntityType.WORKFLOW_ACTIONS },
    { hasCount: false },
  );
  const flowId = useQueryChange("flowId");
  const { data: workflows } = useFind(
    {
      entity: EntityType.WORKFLOW,
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
    },
    {
      enabled: !!flowId,
    },
  );
  const router = useAppRouter();
  const directionMemo = useMemo(() => {
    return workflow?.direction;
  }, [flowId, workflow?.direction]);
  const { screenToFlowPosition, getNodes, setNodes } = useReactFlow();
  const [executionStates, setExecutionStates] = useState<
    Record<string, { state: "start" | "success" }>
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
  const { mutate: updateWorkflow } = useUpdate(EntityType.WORKFLOW, {
    invalidate: false,
  });
  const {
    mutate: updateWorkflowDefinition,
    isPending: isDefinitionSaving,
  } = useUpdate(EntityType.WORKFLOW, {
    invalidate: false,
  });
  const {
    yaml,
    setYaml,
    definition,
    updateDefinition,
    saveDefinition,
    isDefinitionDirty,
  } = useWorkflowDefinitionState({
    flowId,
    workflow,
    actionsByName,
    hasActions,
    updateWorkflow: updateWorkflowDefinition,
  });
  const addActionStep = (action: IAction, insertPath?: FlowStepPath | null) => {
    const baseDefinition = definition ?? createBaseDefinition(workflow);
    const nextTaskName = createTaskName(
      action.name,
      baseDefinition.tasks ?? {},
    );
    const taskDescription = action.description?.trim();
    const nextTasks = {
      ...baseDefinition.tasks,
      [nextTaskName]: {
        action: action.name,
        ...(taskDescription ? { description: taskDescription } : {}),
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

    updateDefinition(nextDefinition);
  };
  const selectNodes = (nodeIds: string[]): void => {
    setSelectedNodeIds(nodeIds);
    const changes = getNodes().map(({ id }) => ({
      id,
      type: "select",
      selected: nodeIds.includes(id),
    })) as NodeChange<Node>[];

    setNodes((nodes) => applyNodeChanges(changes, nodes));
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

    updateDefinition(nextDefinition);

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

  useSubscribe(
    "workflow",
    ({
      step,
      state,
    }: (
      | WorkflowEventMap["hook:step:start"]
      | WorkflowEventMap["hook:step:success"]
    ) & {
      state: "start" | "success";
    }) => {
      if (state) {
        const stepId = `^step-${step.id.replace(":", "-").replaceAll("branch.", "[^-]+").replaceAll(".", "-")}`;
        const idRegex = new RegExp(stepId);
        const foundedNode = getNodes().find((n) => n.id.match(idRegex));

        if (foundedNode?.id) {
          if (state === "start") {
            setExecutionStates((old) => ({
              ...old,
              [foundedNode.id]: { state: "start" },
            }));
          } else if (state === "success") {
            setTimeout(() => {
              setExecutionStates((old) => ({
                ...old,
                [foundedNode.id]: { state: "success" },
              }));
            }, 500);
          }
        }
      }
    },
  );

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
        setYaml,
        workflow,
        workflows,
        updateWorkflow,
        debouncedWorkflowUpdate,
        executionStates,
        setExecutionStates,
        updateDefinition,
        saveDefinition,
        isDefinitionDirty,
        isDefinitionSaving,
        addActionStep,
        removeStepAtPath,
        actions,
        definition,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};
