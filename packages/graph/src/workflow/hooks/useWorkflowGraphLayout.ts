/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { CompiledStep, TaskDefinitions } from "@hexabot-ai/agentic";
import type { ResizeControlDirection } from "@xyflow/system";
import { useEffect, useRef, useState } from "react";

import { EMPTY_WORKFLOW_GRAPH } from "../constants/workflow.constants";
import type {
  MemoryDefinition,
  WorkflowGraphData,
} from "../types/workflow-node.types";
import {
  buildNodesAndEdges,
  getWorkflowDefaultConfig,
} from "../utils/workflow-node.utils";

type UseWorkflowGraphLayoutProps = {
  compiledFlow?: CompiledStep[];
  tasks?: TaskDefinitions;
  memoryDefinitions?: MemoryDefinition[];
  layoutDirection?: ResizeControlDirection;
};

export const useWorkflowGraphLayout = ({
  compiledFlow,
  tasks,
  memoryDefinitions,
  layoutDirection,
}: UseWorkflowGraphLayoutProps) => {
  const [graphData, setGraphData] =
    useState<WorkflowGraphData>(EMPTY_WORKFLOW_GRAPH);
  const requestTokenRef = useRef(0);
  const isEmptyWorkflow = !compiledFlow?.length;

  useEffect(() => {
    const requestToken = requestTokenRef.current + 1;

    requestTokenRef.current = requestToken;
    let cancelled = false;

    const layoutGraph = async () => {
      if (!compiledFlow?.length) {
        if (!cancelled && requestTokenRef.current === requestToken) {
          setGraphData(EMPTY_WORKFLOW_GRAPH);
        }

        return;
      }

      try {
        const config = getWorkflowDefaultConfig(layoutDirection);
        const layoutedGraph = await buildNodesAndEdges({
          config,
          flow: compiledFlow,
          tasks,
          memoryDefinitions: memoryDefinitions ?? [],
        });

        if (!cancelled && requestTokenRef.current === requestToken) {
          setGraphData(layoutedGraph ?? EMPTY_WORKFLOW_GRAPH);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to layout workflow graph:", error);

        if (!cancelled && requestTokenRef.current === requestToken) {
          setGraphData(EMPTY_WORKFLOW_GRAPH);
        }
      }
    };

    void layoutGraph();

    return () => {
      cancelled = true;
    };
  }, [compiledFlow, layoutDirection, memoryDefinitions, tasks]);

  return {
    graphData,
    isEmptyWorkflow,
  };
};
