/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  insertStepAtPath,
  Workflow as WorkflowLib,
  type FlowStep,
  type WorkflowDefinition,
} from "@hexabot-ai/agentic";
import { Box, styled } from "@mui/material";
import { useReactFlow } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useDialogs } from "@/hooks/useDialogs";
import type { IAction } from "@/types/action.types";
import type { IWorkflow } from "@/types/workfow.types";

import { RotateButton } from "../components/controls/RotateButton";
import { WorkflowFormDialog } from "../components/forms/WorkflowFormDialog";
import { ActionFormDrawer } from "../components/main/ActionDrawer/ActionFormDrawer";
import { ActionListDrawer } from "../components/main/ActionDrawer/ActionListDrawer";
import { FlowsDrawer } from "../components/main/FlowsDrawer";
import { ReactFlowWrapper } from "../components/main/ReactFlowWrapper";
import { useFocusNode } from "../hooks/useFocusNode";
import { useNodesMeasured } from "../hooks/useNodesMeasured";
import { useWorkflow } from "../hooks/useWorkflow";
import { WorkflowGraph } from "../types/workflow-node.types";
import type {
  EdgeInsertData,
  FlowStepPath,
} from "../types/workflow-path.types";
import { getWorkflowDefaultConfig } from "../utils/graph.utils";
import {
  createBaseDefinition,
  createTaskName,
} from "../utils/workflow-definition.utils";
import {
  buildNodesAndEdges
} from "../utils/workflow-node.utils";

import { WorkflowEmptyState } from "./WorkflowEmptyState";

const StyledBox = styled(Box)(() => ({
  position: "relative",
  height: "100%",
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
}));

export const Workflow = () => {
  const { setViewport } = useReactFlow();
  const {
    yaml,
    workflow,
    direction,
    debouncedWorkflowUpdate,
    updateWorkflowURL,
    setYaml,
    definition,
    setDefinition,
    actions,
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
  const [graph, setGraph] = useState<WorkflowGraph>({
    nodes: [],
    edges: [],
  });
  const isEmptyWorkflow = graph.nodes.length === 0;
  const [actionsDrawerOpen, setActionsDrawerOpen] = useState(false);
  const [pendingInsertPath, setPendingInsertPath] =
    useState<FlowStepPath | null>(null);
  const actionsDrawerId = "workflow-actions-drawer";
  const handleEdgeInsert = useCallback((insertPath: FlowStepPath) => {
    setPendingInsertPath(insertPath);
    setActionsDrawerOpen(true);
  }, []);
  const handleActionSelect = useCallback(
    (action: IAction) => {
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
      const insertedDefinition = pendingInsertPath
        ? insertStepAtPath(definitionWithTask, pendingInsertPath, nextStep)
        : null;
      const nextDefinition: WorkflowDefinition = insertedDefinition ?? {
        ...definitionWithTask,
        flow: [...(baseDefinition.flow ?? []), nextStep],
      };

      setDefinition(nextDefinition);
      setYaml(WorkflowLib.stringifyDefinition(nextDefinition));
      setActionsDrawerOpen(false);
      setPendingInsertPath(null);
    },
    [definition, pendingInsertPath, setYaml, workflow],
  );

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
    if (!isEmptyWorkflow) {
      setActionsDrawerOpen(false);
    }
  }, [isEmptyWorkflow]);
  const edgesWithHandlers = useMemo(() => {
    return graph.edges.map((edge) => {
      const edgeData = edge.data as EdgeInsertData | undefined;

      if (!edgeData?.insertPath) {
        return edge;
      }

      return {
        ...edge,
        data: {
          ...edgeData,
          onInsert: handleEdgeInsert,
        },
      };
    });
  }, [graph.edges, handleEdgeInsert]);
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
          defaultEdges={edgesWithHandlers || []}
          defaultNodes={graph?.nodes || []}
          defaultViewport={defaultViewport}
        />
        {isEmptyWorkflow && (
          <WorkflowEmptyState
            drawerId={actionsDrawerId}
            drawerOpen={actionsDrawerOpen}
            onOpenActionsDrawer={() => {
              setPendingInsertPath(null);
              setActionsDrawerOpen(true);
            }}
          />
        )}
        <ActionListDrawer
          actions={actions}
          drawerId={actionsDrawerId}
          open={actionsDrawerOpen}
          onActionSelect={handleActionSelect}
          onClose={() => {
            setActionsDrawerOpen(false);
            setPendingInsertPath(null);
          }}
        />
        <RotateButton />
      </StyledBox>
      <ActionFormDrawer />
    </div>
  );
};
