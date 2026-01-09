/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Actions } from "@hexabot-ai/agentic";
import { Box, debounce, IconButton, styled } from "@mui/material";
import { useReactFlow, useViewport } from "@xyflow/react";
import { useEffect } from "react";

import { useQueryChange } from "@/hooks/useQueryChange";
import { useSafeCallback } from "@/hooks/useSafeCallback";
import { useSafeMemo } from "@/hooks/useSafeMemo";

import { AnimatedIcon } from "../components/icons/AnimatedIcon";
import { FlowsTabs } from "../components/main/FlowsTabs";
import { ReactFlowWrapper } from "../components/main/ReactFlowWrapper";
import { useCreateWorkflow } from "../hooks/useCreateWorkflow";
import { useFocusNode } from "../hooks/useFocusNode";
import { useNodesMeasured } from "../hooks/useNodesMeasured";
import { useWorkflow } from "../hooks/useWorkflow";
import { getWorkflowDefaultConfig } from "../utils/graph.utils";
import { buildNodesAndEdges } from "../utils/workflow-node.utils";

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

export const Main = () => {
  const { setViewport, fitView } = useReactFlow();
  const {
    selectedFlowId,
    direction,
    setDirection,
    yaml,
    setYaml,
    setSelectedFlowId,
    getDefinition,
  } = useWorkflow();
  const { animateFocus } = useFocusNode();
  const { createWorkflow } = useCreateWorkflow();
  const defaultViewport = useViewport();

  useNodesMeasured((nodesToFocus, selectedNodes, nodesInitialized) => {
    setViewport(defaultViewport);
    if (nodesInitialized && nodesToFocus.length) {
      animateFocus(nodesToFocus);
    } else if (!selectedNodes.length) {
      fitView({ duration: 100, interpolate: "smooth" });
    }
  });

  const handleViewportUpdate = useSafeCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    debounce(({ zoom, x, y }) => {
      if (selectedFlowId) {
        //
      }
    }, 400),
    [selectedFlowId],
    (memoizedFn) => {
      memoizedFn.clear();
    },
  );
  const graph = useSafeMemo(
    () => {
      if (yaml) {
        const definition = getDefinition(yaml, { actions: DEFAULT_ACTIONS });
        const config = getWorkflowDefaultConfig(direction);

        return (
          buildNodesAndEdges({ config, definition }) ?? { nodes: [], edges: [] }
        );
      }
    },
    [yaml, direction],
    { nodes: [], edges: [] },
  );
  const queryFlowId = useQueryChange("flowId", (value) => {
    if (value) {
      setSelectedFlowId(value);
    } else {
      setSelectedFlowId("");
      setYaml("");
    }
  });

  useEffect(() => {
    if (!queryFlowId && yaml) {
      createWorkflow(yaml, { actions: DEFAULT_ACTIONS });
    }
  }, [yaml]);

  return (
    <>
      <FlowsTabs />
      <StyledBox>
        <ReactFlowWrapper
          onViewport={handleViewportUpdate}
          defaultEdges={graph?.edges || []}
          defaultNodes={graph?.nodes || []}
          defaultViewport={defaultViewport}
        />
      </StyledBox>
      <IconButton
        style={{
          position: "absolute",
          bottom: 119,
          left: 14,
          height: "26px",
          width: "28px",
          backgroundColor: "#fff",
          borderRadius: 0,
          border: "1px solid #0001",
          padding: "2px 3px",
        }}
        size="small"
        onClick={() => {
          setDirection(direction === "horizontal" ? "vertical" : "horizontal");
        }}
      >
        <AnimatedIcon
          canRotate={direction === "vertical"}
          from="-45"
          to="45"
          htmlColor="#000000de"
        />
      </IconButton>
    </>
  );
};
