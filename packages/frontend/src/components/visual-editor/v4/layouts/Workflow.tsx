/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  type WorkflowCompileOptions,
  type WorkflowDefinition,
  isSnakeCaseName,
  toSnakeCase,
} from "@hexabot-ai/agentic";
import { Box, styled } from "@mui/material";
import { useReactFlow } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { stringify } from "yaml";

import { useFind } from "@/hooks/crud/useFind";
import { useDialogs } from "@/hooks/useDialogs";
import { EntityType } from "@/services/types";
import type { IAction } from "@/types/action.types";
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

import { WorkflowActionsDrawer } from "./WorkflowActionsDrawer";
import { WorkflowEmptyState } from "./WorkflowEmptyState";

const StyledBox = styled(Box)(() => ({
  position: "relative",
  height: "100%",
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
}));
const DEFAULT_WORKFLOW_NAME = "new_workflow";
const DEFAULT_WORKFLOW_VERSION = "1.0.0";
const createBaseDefinition = (workflow?: IWorkflow): WorkflowDefinition => ({
  workflow: {
    name: workflow?.name ?? DEFAULT_WORKFLOW_NAME,
    version: workflow?.version ?? DEFAULT_WORKFLOW_VERSION,
    ...(workflow?.description?.trim()
      ? { description: workflow.description.trim() }
      : {}),
  },
  tasks: {},
  flow: [],
  outputs: {},
});
const createTaskName = (
  actionName: string,
  tasks: WorkflowDefinition["tasks"],
) => {
  const snakeCaseName = toSnakeCase(actionName);
  const baseName = isSnakeCaseName(snakeCaseName)
    ? snakeCaseName
    : snakeCaseName
      ? `${snakeCaseName}_task`
      : "new_task";
  const normalizedBase = isSnakeCaseName(baseName) ? baseName : "new_task";
  let candidate = normalizedBase;
  let suffix = 2;

  while (Object.prototype.hasOwnProperty.call(tasks, candidate)) {
    candidate = `${normalizedBase}_${suffix}`;
    suffix += 1;
  }

  return candidate;
};

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
    setYaml,
  } = useWorkflow();
  const { animateFocus } = useFocusNode();
  const dialogs = useDialogs();
  // Cache the action map by content signature to avoid re-parsing on each render.
  const actionsSignature = useMemo(
    () =>
      actions
        .map(
          (action) =>
            `${action.id}:${action.name}:${action.updatedAt ?? ""}`,
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
  const defaultViewport = useMemo(
    () => ({
      x: workflow?.x || 0,
      y: workflow?.y || 0,
      zoom: workflow?.zoom || 1,
    }),
    [workflow?.id, workflow?.x, workflow?.y, workflow?.zoom],
  );
  const [definition, setDefinition] = useState<WorkflowDefinition>();
  const [graph, setGraph] = useState<WorkflowGraph>({
    nodes: [],
    edges: [],
  });
  const isEmptyWorkflow = graph.nodes.length === 0;
  const [actionsDrawerOpen, setActionsDrawerOpen] = useState(false);
  const actionsDrawerId = "workflow-actions-drawer";
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
      const nextFlow = [...(baseDefinition.flow ?? []), { do: nextTaskName }];
      const nextOutputs =
        baseDefinition.outputs && Object.keys(baseDefinition.outputs).length > 0
          ? baseDefinition.outputs
          : { result: `=$output.${nextTaskName}` };
      const nextDefinition: WorkflowDefinition = {
        ...baseDefinition,
        tasks: nextTasks,
        flow: nextFlow,
        outputs: nextOutputs,
      };

      setDefinition(nextDefinition);
      setYaml(stringify(nextDefinition));
      setActionsDrawerOpen(false);
    },
    [definition, setYaml, workflow],
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
        {isEmptyWorkflow && (
          <WorkflowEmptyState
            drawerId={actionsDrawerId}
            drawerOpen={actionsDrawerOpen}
            onOpenActionsDrawer={() => setActionsDrawerOpen(true)}
          />
        )}
        <WorkflowActionsDrawer
          actions={actions}
          drawerId={actionsDrawerId}
          open={actionsDrawerOpen}
          onActionSelect={handleActionSelect}
          onClose={() => setActionsDrawerOpen(false)}
        />
        <RotateButton />
      </StyledBox>
    </div>
  );
};
