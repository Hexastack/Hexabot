/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { debounce } from "@mui/material";
import {
  type Node,
  type NodeChange,
  type XYPosition,
  applyNodeChanges,
  useReactFlow,
} from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";

import { useFind } from "@/hooks/crud/useFind";
import { useGet, useGetFromCache } from "@/hooks/crud/useGet";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useQueryChange } from "@/hooks/useQueryChange";
import { useSafeCallback } from "@/hooks/useSafeCallback";
import { EntityType, RouterType } from "@/services/types";
import { IWorkflowAttributes } from "@/types/workfow.types";

import { WorkflowContext } from "../contexts/workflow.context";
import type { WorkflowContextProps } from "../types/workflow.types";

export const WorkflowProvider: React.FC<WorkflowContextProps> = ({
  children,
}) => {
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
  const { screenToFlowPosition, getNodes, setNodes } = useReactFlow();
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
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};
