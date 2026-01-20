/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  WorkflowCompileOptions,
  WorkflowDefinition,
  WorkflowEventMap,
} from "@hexabot-ai/agentic";
import debounce from "@mui/utils/debounce";
import {
  type Node,
  type NodeChange,
  type XYPosition,
  applyNodeChanges,
  useReactFlow,
} from "@xyflow/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useFind } from "@/hooks/crud/useFind";
import { useGet, useGetFromCache } from "@/hooks/crud/useGet";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useQueryChange } from "@/hooks/useQueryChange";
import { useSafeCallback } from "@/hooks/useSafeCallback";
import { EntityType, RouterType } from "@/services/types";
import type { IWorkflowAttributes } from "@/types/workfow.types";
import { useSubscribe } from "@/websocket/socket-hooks";

import { WorkflowContext } from "../contexts/workflow.context";
import type { WorkflowContextProps } from "../types/workflow.types";
import { getDefinition } from "../utils/workflow-node.utils";

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
  const [yaml, setYaml] = useState("");
  const [definition, setDefinition] = useState<WorkflowDefinition>();
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
  const { mutate: updateWorkflow } = useUpdate(EntityType.WORKFLOW, {
    invalidate: false,
  });
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
    setYaml(workflow?.definitionYaml || "");
  }, [workflow?.definitionYaml]);
  useEffect(() => {
    if (!flowId && workflows?.length) {
      updateWorkflowURL(workflows[0].id);
    }
  }, [flowId, workflows, updateWorkflowURL]);

  useEffect(() => {
    if (!yaml || actions.length === 0) {
      setDefinition(undefined);

      return;
    }

    try {
      setDefinition(
        getDefinition(yaml, {
          actions: actionsByName,
        }),
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to parse workflow definition:", error);
      setDefinition(undefined);
    }
  }, [actions.length, actionsByName, yaml]);

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
        actions,
        definition,
        setDefinition,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};
