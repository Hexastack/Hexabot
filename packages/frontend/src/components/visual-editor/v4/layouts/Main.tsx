/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Action,
  BaseWorkflowContext,
  compileWorkflow,
  Settings,
  validateWorkflow,
} from "@hexabot-ai/agentic";
import { Box, debounce, IconButton, styled } from "@mui/material";
import {
  useNodesInitialized,
  useReactFlow,
  useViewport,
  Viewport,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo } from "react";

import { useCreate } from "@/hooks/crud/useCreate";
import { useGet } from "@/hooks/crud/useGet";
import { useAppRouter } from "@/hooks/useAppRouter";
import { EntityType } from "@/services/types";

import { AnimatedIcon } from "../components/icons/AnimatedIcon";
import { FlowsTabs } from "../components/main/FlowsTabs";
import { ReactFlowWrapper } from "../components/main/ReactFlowWrapper";
import { useFocusNode } from "../hooks/useFocusNode";
import { useWorkflow } from "../hooks/useWorkflow";
import { TCb } from "../types/workflow.types";
import { getWorkflowDefaultConfig } from "../utils/graph.utils";
import { buildNodesAndEdges } from "../utils/workflow-node.utils";

//TODO: Mock data need to be removed
const DEFAULT_ACTIONS: TActions = [
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

type TActions = Record<
  string,
  Action<unknown, unknown, BaseWorkflowContext, Settings>
>;
const StyledBox = styled(Box)(() => ({
  position: "relative",
  height: "100%",
}));

export const Main = () => {
  const nodesInitialized = useNodesInitialized();
  const { query } = useAppRouter();
  const { flowId } = query;
  const { setViewport, fitView } = useReactFlow();
  const {
    selectedFlowId,
    setSelectedFlowId,
    toFocusIds,
    direction,
    setDirection,
    yaml,
    setYaml,
    updateWorkflowURL,
    actions,
    selectedNodeIds,
  } = useWorkflow();
  const { animateFocus } = useFocusNode();

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
  const definition = useMemo(() => {
    const validation = validateWorkflow(yaml);

    if (validation.success) {
      const { definition } = compileWorkflow(validation.data, {
        actions: DEFAULT_ACTIONS,
      });

      return definition;
    }
  }, [yaml]);
  const { mutate: createWorkflow } = useCreate(EntityType.WORKFLOW);
  const defaultViewport = useViewport();
  //TODO need to save viewport update (offset.x,offset.y,zoom)
  const handleViewportUpdate: TCb<Viewport> = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    debounce(({ zoom, x, y }) => {
      if (selectedFlowId) {
        //
      }
    }, 400),
    [selectedFlowId],
  );

  useEffect(() => {
    if (flowId) {
      if (typeof flowId === "string") {
        setSelectedFlowId(flowId);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowId]);

  useEffect(() => {
    setViewport(defaultViewport);

    if (nodesInitialized && toFocusIds.length) {
      animateFocus(toFocusIds);
    } else if (!selectedNodeIds.length) {
      fitView({ duration: 100, interpolate: "smooth" });
    }
  }, [nodesInitialized]);

  useEffect(() => {
    return () => {
      handleViewportUpdate.clear();
    };
  }, [handleViewportUpdate]);

  const config = useMemo(
    () => getWorkflowDefaultConfig(direction),
    [getWorkflowDefaultConfig, direction],
  );
  const buildGraphProps = useMemo(
    () => ({
      config,
      definition,
    }),
    [config, definition],
  );
  const graph = useMemo(() => {
    return buildNodesAndEdges(buildGraphProps) || { nodes: [], edges: [] };
  }, [buildGraphProps, yaml, actions?.length]);

  useEffect(() => {
    if (!selectedFlowId && definition) {
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
          onViewport={handleViewportUpdate}
          defaultEdges={graph.edges}
          defaultNodes={graph.nodes}
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
    </div>
  );
};
