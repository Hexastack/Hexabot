/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  type Node,
  type NodeChange,
  type XYPosition,
  applyNodeChanges,
  useReactFlow,
} from "@xyflow/react";
import type { ResizeControlDirection } from "@xyflow/system";
import { useState } from "react";

import { useGet, useGetFromCache } from "@/hooks/crud/useGet";
import { useAppRouter } from "@/hooks/useAppRouter";
import { EntityType, RouterType } from "@/services/types";

import { WorkflowContext } from "../contexts/workflow.context";
import { useDefinition } from "../hooks/useDefinition";
import type { WorkflowContextProps } from "../types/workflow.types";

export const WorkflowProvider: React.FC<WorkflowContextProps> = ({
  children,
}) => {
  const router = useAppRouter();
  const { screenToFlowPosition, getNodes, setNodes } = useReactFlow();
  const getWorkflowFromCache = useGetFromCache(EntityType.WORKFLOW);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [openSearchPanel, setOpenSearchPanel] = useState(false);
  const [selectedFlowId, setSelectedFlowId] = useState<string>("");
  const [toFocusIds, setToFocusIds] = useState<string[]>([]);
  const [direction, setDirection] =
    useState<ResizeControlDirection>("horizontal");
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
    if (selectedFlowId) {
      await router.replace(`/${RouterType.WORKFLOW_EDITOR}/${selectedFlowId}`);
    }
  };
  //agentic
  const [yaml, setYaml] = useState<string>("");
  const { getDefinition } = useDefinition();

  useGet(
    selectedFlowId,
    {
      entity: EntityType.WORKFLOW,
    },
    {
      enabled: !!selectedFlowId,
      onSuccess(data) {
        if (data?.definitionYaml) {
          setYaml(data.definitionYaml);
        }
      },
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
        selectedFlowId,
        setSelectedFlowId,
        direction,
        setDirection,
        updateWorkflowURL,
        removeWorkflowParams,
        //agentic
        yaml,
        setYaml,
        // actions,
        getDefinition,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};
