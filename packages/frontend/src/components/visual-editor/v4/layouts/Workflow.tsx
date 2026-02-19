/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { StepType, Workflow as WorkflowHelper } from "@hexabot-ai/agentic";
import { Box, Button, styled } from "@mui/material";
import {
  Background,
  Controls,
  useNodesInitialized,
  useReactFlow,
  useStore,
} from "@xyflow/react";
import { CloudUpload } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";

import { ConfirmDialogBody } from "@/app-components/dialogs";
import { useWorkflowActionsCatalog } from "@/contexts/workflow-actions.context";
import { useDelete } from "@/hooks/crud/useDelete";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useDialogs } from "@/hooks/useDialogs";
import { useTranslate } from "@/hooks/useTranslate";
import { theme } from "@/layout/theme";
import { EntityType } from "@/services/types";
import type { IAction } from "@/types/action.types";
import { IMemoryDefinition } from "@/types/memory-definition.types";
import { WorkflowVersionAction } from "@/types/workfow-version.types";
import type { IWorkflow } from "@/types/workfow.types";

import { RotateButton } from "../components/controls/RotateButton";
import { WorkflowFormDialog } from "../components/forms/WorkflowFormDialog";
import { ActionFormDrawer } from "../components/main/ActionDrawer/ActionFormDrawer";
import { ActionListDrawer } from "../components/main/ActionDrawer/ActionListDrawer";
import { ConditionalFormDrawer } from "../components/main/ConditionalDrawer/ConditionalFormDrawer";
import { FlowsDrawer } from "../components/main/FlowsDrawer";
import { LoopFormDrawer } from "../components/main/LoopDrawer/LoopFormDrawer";
import { ParallelFormDrawer } from "../components/main/ParallelDrawer/ParallelFormDrawer";
import { ReactFlowWrapper } from "../components/main/ReactFlowWrapper";
import { WorkflowBottomDrawer } from "../components/main/WorkflowBottomDrawer";
import { WorkflowMenu } from "../components/main/WorkflowMenu";
import { WorkflowTitleBar } from "../components/main/WorkflowTitleBar";
import { WorkflowInsertMenu } from "../components/WorkflowInsertMenu";
import { useFocusNode } from "../hooks/useFocusNode";
import { useNodesMeasured } from "../hooks/useNodesMeasured";
import { useWorkflow } from "../hooks/useWorkflow";
import {
  ENodeType,
  type BranchPlaceholderData,
  type WorkflowGraph,
} from "../types/workflow-node.types";
import type {
  EdgeInsertData,
  EdgeInsertType,
  FlowStepPath,
  OnOpenInsertMenu,
} from "../types/workflow-path.types";
import { getWorkflowDefaultConfig } from "../utils/graph.utils";
import { createBaseDefinition } from "../utils/workflow-definition.utils";
import { buildNodesAndEdges } from "../utils/workflow-node.utils";

import { WorkflowEmptyState } from "./WorkflowEmptyState";

const StyledBox = styled(Box)(() => ({
  position: "relative",
  height: "100%",
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
}));
const WorkflowTitleOverlay = styled(Box)(() => ({
  position: "absolute",
  top: 12,
  left: 12,
  zIndex: 2,
  maxWidth: "calc(100% - 24px)",
}));
const WorkflowPublishOverlay = styled(Box)(() => ({
  position: "absolute",
  top: 12,
  right: 12,
  zIndex: 2,
}));

export const Workflow = () => {
  const { setViewport, fitView } = useReactFlow();
  const domNode = useStore((state) => state.domNode);
  const nodesInitialized = useNodesInitialized();
  const { t } = useTranslate();
  const {
    workflow,
    workflows,
    selectedFlowId,
    direction,
    debouncedWorkflowUpdate,
    updateWorkflowURL,
    definition,
    flow,
    isDefinitionDirty,
    isSaving: isDefinitionSaving,
    persistDefinition,
    addActionStep,
    addConditionalStep,
    addLoopStep,
    addParallelStep,
  } = useWorkflow();
  const { actions } = useWorkflowActionsCatalog();
  const { animateFocus } = useFocusNode();
  const dialogs = useDialogs();
  const { mutate: deleteWorkflow } = useDelete(EntityType.WORKFLOW);
  const defaultViewport = useMemo(
    () => ({
      x: workflow?.x || 0,
      y: workflow?.y || 0,
      zoom: workflow?.zoom || 1,
    }),
    [workflow?.id, workflow?.x, workflow?.y, workflow?.zoom],
  );
  const emptyViewport = useMemo(
    () => ({
      x: (domNode?.clientWidth || 0) / 2,
      y: (domNode?.clientHeight || 0) / 2,
      zoom: 1,
    }),
    [domNode?.clientWidth, domNode?.clientHeight],
  );
  const [graph, setGraph] = useState<WorkflowGraph>({
    nodes: [],
    edges: [],
  });
  const isEmptyWorkflow = graph.nodes.length < 3;
  const [shouldCenterAfterFirstInsert, setShouldCenterAfterFirstInsert] =
    useState(false);
  const [actionsDrawerOpen, setActionsDrawerOpen] = useState(false);
  const [pendingInsertPath, setPendingInsertPath] =
    useState<FlowStepPath | null>(null);
  const [insertMenuAnchorEl, setInsertMenuAnchorEl] =
    useState<HTMLElement | null>(null);
  const [insertMenuPath, setInsertMenuPath] = useState<FlowStepPath | null>(
    null,
  );
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [menuFlowId, setMenuFlowId] = useState<string | null>(null);
  const actionsDrawerId = "workflow-actions-drawer";
  const sharedInsertMenuId = "workflow-insert-menu";
  const publishLabel = t("button.publish");
  const isCurrentVersionPublished =
    Boolean(workflow?.currentVersion) &&
    workflow?.currentVersion === workflow?.publishedVersion;
  const isPublishDisabled =
    !definition || isDefinitionSaving || isCurrentVersionPublished;
  const tasks = definition?.tasks;
  const handleInsert = useCallback(
    (insertType: EdgeInsertType = "step", insertPath?: FlowStepPath | null) => {
      if (insertType === StepType.Conditional) {
        setPendingInsertPath(null);
        addConditionalStep(insertPath);

        return;
      }
      if (insertType === StepType.Loop) {
        setPendingInsertPath(null);
        addLoopStep(insertPath);

        return;
      }
      if (insertType === StepType.Parallel) {
        setPendingInsertPath(null);
        addParallelStep(insertPath);

        return;
      }
      if (insertType !== "step") {
        return;
      }

      setPendingInsertPath(insertPath ?? null);
      setActionsDrawerOpen(true);
    },
    [addConditionalStep, addLoopStep, addParallelStep],
  );
  const handleRootInsert = useCallback(
    (insertType: EdgeInsertType = "step") => {
      if (isEmptyWorkflow) {
        setShouldCenterAfterFirstInsert(true);
      }
      handleInsert(insertType, null);
    },
    [handleInsert, isEmptyWorkflow],
  );
  const handleOpenInsertMenu = useCallback<OnOpenInsertMenu>(
    (anchorEl, insertPath) => {
      setInsertMenuAnchorEl(anchorEl);
      setInsertMenuPath(insertPath);
    },
    [],
  );
  const handleCloseInsertMenu = useCallback(() => {
    setInsertMenuAnchorEl(null);
    setInsertMenuPath(null);
  }, []);
  const handleSharedInsert = useCallback(
    (insertType: EdgeInsertType = "step") => {
      if (!insertMenuPath) {
        return;
      }

      handleInsert(insertType, insertMenuPath);
    },
    [handleInsert, insertMenuPath],
  );
  const handleActionSelect = useCallback(
    (action: IAction) => {
      addActionStep(action, pendingInsertPath);
      setActionsDrawerOpen(false);
      setPendingInsertPath(null);
    },
    [addActionStep, pendingInsertPath],
  );

  useNodesMeasured(({ nodesToFocus, nodesInitialized }) => {
    if (nodesInitialized) {
      if (nodesToFocus.length) {
        animateFocus(nodesToFocus);
      } else if (isEmptyWorkflow) {
        setViewport(emptyViewport);
      } else {
        setViewport(defaultViewport);
      }
    }
  });
  useEffect(() => {
    if (nodesInitialized && isEmptyWorkflow) {
      setViewport(emptyViewport);
    }
  }, [isEmptyWorkflow, nodesInitialized]);
  const getMemoryDefinitionsFromCache = useGetFromCache(
    EntityType.MEMORY_DEFINITION,
  );

  useEffect(() => {
    let isCancelled = false;

    const layoutGraph = async () => {
      if (!flow?.length) {
        setGraph({ nodes: [], edges: [] });

        return;
      }

      try {
        const memoryDefinitions = (workflow?.memoryDefinitions || []).map(
          getMemoryDefinitionsFromCache,
        ) as IMemoryDefinition[];
        const config = getWorkflowDefaultConfig(direction);
        const layoutedGraph = await buildNodesAndEdges({
          config,
          flow,
          tasks,
          memoryDefinitions,
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
  }, [flow, direction, tasks]);

  useEffect(() => {
    if (!isEmptyWorkflow) {
      setActionsDrawerOpen(false);
    }
  }, [isEmptyWorkflow]);
  useEffect(() => {
    if (isEmptyWorkflow || !shouldCenterAfterFirstInsert || !nodesInitialized) {
      return;
    }

    fitView();
    setShouldCenterAfterFirstInsert(false);
  }, [
    fitView,
    isEmptyWorkflow,
    nodesInitialized,
    shouldCenterAfterFirstInsert,
  ]);
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
          onOpenInsertMenu: handleOpenInsertMenu,
        },
      };
    });
  }, [graph.edges, handleOpenInsertMenu]);
  const nodesWithHandlers = useMemo(() => {
    return graph.nodes.map((node) => {
      if (node.type !== ENodeType.BRANCH_PLACEHOLDER) {
        return node;
      }

      const nodeData = node.data as BranchPlaceholderData | undefined;

      if (!nodeData?.insertPath) {
        return node;
      }

      return {
        ...node,
        data: {
          ...nodeData,
          onOpenInsertMenu: handleOpenInsertMenu,
        },
      };
    });
  }, [graph.nodes, handleOpenInsertMenu]);
  const handleNewWorkflow = () => {
    const baseDefinition = createBaseDefinition();
    const baseYaml = WorkflowHelper.stringifyDefinition(baseDefinition);

    dialogs.open(WorkflowFormDialog, {
      defaultValues: null,
      presetValues: {
        definition: baseDefinition,
        definitionYaml: baseYaml,
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
  const handleOpenMenu = (
    event: ReactMouseEvent<HTMLElement>,
    flowId: string,
  ) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuFlowId(flowId);
  };
  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setMenuFlowId(null);
  };
  const handleDelete = async () => {
    const selectedMenuWorkflow = menuFlowId
      ? (workflows?.find((flow) => flow.id === menuFlowId) ??
        (workflow?.id === menuFlowId ? workflow : undefined))
      : workflow;

    if (!selectedMenuWorkflow) {
      handleCloseMenu();

      return;
    }

    const flowId = selectedMenuWorkflow.id;
    const fallbackFlowId = workflows?.find((flow) => flow.id !== flowId)?.id;

    handleCloseMenu();
    const isConfirmed = await dialogs.confirm(ConfirmDialogBody);

    if (!isConfirmed) {
      return;
    }

    deleteWorkflow(flowId, {
      onSuccess: () => {
        if (selectedFlowId === flowId && fallbackFlowId) {
          updateWorkflowURL(fallbackFlowId);
        }
      },
    });
  };

  // useEffect(() => {
  //   console.log({ emptyViewport });
  //   setViewport(emptyViewport);
  // }, [workflow?.id, isEmptyWorkflow]);

  return (
    <div className="visual-editor-v4">
      <FlowsDrawer onNew={handleNewWorkflow} onEdit={handleEditWorkflow} />
      <StyledBox>
        <ReactFlowWrapper
          onViewport={debouncedWorkflowUpdate}
          defaultEdges={edgesWithHandlers || []}
          defaultNodes={isEmptyWorkflow ? [] : nodesWithHandlers}
          defaultViewport={isEmptyWorkflow ? emptyViewport : defaultViewport}
        >
          <Controls
            onFitView={animateFocus}
            fitViewOptions={{ duration: 200 }}
            style={{
              overflow: "hidden",
              borderRadius: theme.shape.borderRadius,
            }}
          >
            <RotateButton />
          </Controls>

          <Background size={2} />
          {isEmptyWorkflow && (
            <WorkflowEmptyState onInsert={handleRootInsert} />
          )}
        </ReactFlowWrapper>
        {workflow && (
          <WorkflowTitleOverlay>
            <WorkflowTitleBar
              workflow={workflow}
              onEdit={handleEditWorkflow}
              onOpenMenu={handleOpenMenu}
              onSave={() => persistDefinition()}
              saveDisabled={!definition || !isDefinitionDirty}
              saveLoading={isDefinitionSaving}
              saveLabel={t("button.save")}
              renameLabel={t("button.rename")}
              moreLabel={t("button.more")}
            />
          </WorkflowTitleOverlay>
        )}
        {workflow && (
          <WorkflowPublishOverlay>
            <Button
              variant="contained"
              size="large"
              color="primary"
              aria-label={publishLabel}
              startIcon={<CloudUpload />}
              onClick={() => {
                persistDefinition(WorkflowVersionAction.publish);
              }}
              disabled={isPublishDisabled}
            >
              {publishLabel}
            </Button>
          </WorkflowPublishOverlay>
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
        <WorkflowInsertMenu
          id={sharedInsertMenuId}
          anchorEl={insertMenuAnchorEl}
          open={Boolean(insertMenuAnchorEl)}
          onClose={handleCloseInsertMenu}
          onInsert={handleSharedInsert}
        />
        <WorkflowBottomDrawer />
      </StyledBox>
      <ActionFormDrawer />
      <ConditionalFormDrawer />
      <LoopFormDrawer />
      <ParallelFormDrawer />
      <WorkflowMenu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
        deleteDisabled={Boolean(workflow?.builtin)}
        onDelete={handleDelete}
        deleteLabel={t("button.delete")}
      />
    </div>
  );
};
