/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Actions } from "@hexabot-ai/agentic";
import { Box, styled } from "@mui/material";
import { useReactFlow } from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";

import { useCreate } from "@/hooks/crud/useCreate";
import { useSafeMemo } from "@/hooks/useSafeMemo";
import { EntityType } from "@/services/types";

import { RotateButton } from "../components/controls/RotateButton";
import { FlowsTabs } from "../components/main/FlowsTabs";
import { ReactFlowWrapper } from "../components/main/ReactFlowWrapper";
import { useFocusNode } from "../hooks/useFocusNode";
import { useNodesMeasured } from "../hooks/useNodesMeasured";
import { useWorkflow } from "../hooks/useWorkflow";
import { WorkflowGraph } from "../types/workflow-node.types";
import { getWorkflowDefaultConfig } from "../utils/graph.utils";
import {
  buildNodesAndEdges,
  getDefinition,
} from "../utils/workflow-node.utils";
//TODO: Mock data need to be removed
const DEFAULT_ACTIONS: Actions = [
  "call_api",
  "call_llm",
  "send_email",
  "get_user_profile",
  "search_web",
  "query_memory",
  "get_calendar_events",
  "await_user_input",
  "decision_router",
  "create_ticket",
  "llm_generate_object",
  "send_text_message",
  "await_reply",
  "send_text_message",
  "send_attachment",
  "send_quick_replies",
  "send_buttons",
  "send_list",
  "reply",
  "llm_generate_text",
  "content_upsert",
  "html_extract_main",
  "http_request",
].reduce((acc, cur) => {
  acc[cur] = {
    parseSettings: () => {},
  };

  return acc;
}, {});
const StyledBox = styled(Box)(() => ({
  position: "relative",
  height: "100%",
}));

export const Workflow = () => {
  const { setViewport } = useReactFlow();
  const {
    selectedFlowId,
    yaml,
    workflow,
    direction,
    debouncedWorkflowUpdate,
    updateWorkflowURL,
  } = useWorkflow();
  const { animateFocus } = useFocusNode();
  const { mutate: createWorkflow } = useCreate(EntityType.WORKFLOW);
  const defaultViewport = useMemo(
    () => ({
      x: workflow?.x || 0,
      y: workflow?.y || 0,
      zoom: workflow?.zoom || 1,
    }),
    [workflow?.id, workflow?.x, workflow?.y, workflow?.zoom],
  );
  const definition = useSafeMemo(
    () =>
      yaml ? getDefinition(yaml, { actions: DEFAULT_ACTIONS }) : undefined,
    [yaml],
    undefined,
  );
  const [graph, setGraph] = useState<WorkflowGraph>({
    nodes: [],
    edges: [],
  });

  useNodesMeasured(({ nodesToFocus, nodesInitialized }) => {
    if (nodesInitialized) {
      if (nodesToFocus.length) {
        animateFocus(nodesToFocus);
      } else {
        setViewport(defaultViewport);
      }
    }
  });

  useEffect(() => {
    let isCancelled = false;

    const layoutGraph = async () => {
      if (!definition) {
        setGraph({ nodes: [], edges: [] });

        return;
      }

      try {
        const config = getWorkflowDefaultConfig(direction);
        const layoutedGraph = await buildNodesAndEdges({
          config,
          definition,
        });

        if (!isCancelled) {
          setGraph(layoutedGraph ?? { nodes: [], edges: [] });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to layout workflow graph:", error);
        if (!isCancelled) {
          setGraph({ nodes: [], edges: [] });
        }
      }
    };

    layoutGraph();

    return () => {
      isCancelled = true;
    };
  }, [definition, direction]);

  useEffect(() => {
    if (!selectedFlowId && yaml && definition) {
      createWorkflow(
        {
          definitionYaml: yaml,
          definition,
          ...definition.workflow,
        },
        {
          onSuccess(data) {
            updateWorkflowURL(data.id);
          },
        },
      );
    }
  }, [yaml, definition]);

  return (
    <div className="visual-editor-v4">
      <FlowsTabs />
      <StyledBox>
        <ReactFlowWrapper
          onViewport={debouncedWorkflowUpdate}
          defaultEdges={graph?.edges || []}
          defaultNodes={graph?.nodes || []}
          defaultViewport={defaultViewport}
        />
      </StyledBox>
      <RotateButton />
    </div>
  );
};
