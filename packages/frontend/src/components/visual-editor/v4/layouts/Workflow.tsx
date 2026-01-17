/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, styled } from "@mui/material";
import { useReactFlow } from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";

import { useFind } from "@/hooks/crud/useFind";
import { useDialogs } from "@/hooks/useDialogs";
import { useSafeMemo } from "@/hooks/useSafeMemo";
import { EntityType } from "@/services/types";
import type { IWorkflow } from "@/types/workfow.types";

import { RotateButton } from "../components/controls/RotateButton";
import { WorkflowFormDialog } from "../components/forms/WorkflowFormDialog";
import { FlowsDrawer } from "../components/main/FlowsDrawer";
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

const StyledBox = styled(Box)(() => ({
  position: "relative",
  height: "100%",
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
}));

export const Workflow = () => {
  const { data: actions } = useFind(
    { entity: EntityType.WORKFLOW_ACTIONS },
    { hasCount: false },
  );
  const { setViewport } = useReactFlow();
  const {
    yaml,
    workflow,
    direction,
    debouncedWorkflowUpdate,
    updateWorkflowURL,
  } = useWorkflow();
  const { animateFocus } = useFocusNode();
  const dialogs = useDialogs();
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
      yaml && actions
        ? getDefinition(yaml, {
            actions: actions?.reduce((acc, cur) => {
              acc[cur.name] = cur;

              return acc;
            }, {}),
          })
        : undefined,
    [yaml, JSON.stringify(actions)],
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
  const handleNewWorkflow = () => {
    dialogs.open(WorkflowFormDialog, {
      defaultValues: null,
      presetValues: {
        definition,
        definitionYaml: yaml,
        onCreated: (createdWorkflow) => {
          updateWorkflowURL(createdWorkflow.id);
        },
      },
    });
  };
  const handleEditWorkflow = (workflowToEdit: IWorkflow) => {
    dialogs.open(WorkflowFormDialog, {
      defaultValues: workflowToEdit,
    });
  };

  return (
    <div className="visual-editor-v4">
      <FlowsDrawer onNew={handleNewWorkflow} onEdit={handleEditWorkflow} />
      <StyledBox>
        <ReactFlowWrapper
          onViewport={debouncedWorkflowUpdate}
          defaultEdges={graph?.edges || []}
          defaultNodes={graph?.nodes || []}
          defaultViewport={defaultViewport}
        />
        <RotateButton />
      </StyledBox>
    </div>
  );
};
