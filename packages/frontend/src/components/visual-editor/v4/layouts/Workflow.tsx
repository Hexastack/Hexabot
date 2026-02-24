/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  StepType,
  type Settings,
  Workflow as WorkflowHelper,
} from "@hexabot-ai/agentic";
import { Box, Button, Stack, styled } from "@mui/material";
import { Background, Controls } from "@xyflow/react";
import { CloudOff, CloudUpload } from "lucide-react";
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
import { WorkflowSettingsDialog } from "../components/main/WorkflowTitleBar/WorkflowSettingsDialog";
import { WorkflowInsertMenu } from "../components/WorkflowInsertMenu";
import { useWorkflow } from "../hooks/useWorkflow";
import { useWorkflowViewport } from "../hooks/useWorkflowViewport";
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
    updateDefinitionState,
    persistDefinition,
    publishVersion,
    unpublishVersion,
    addActionStep,
    addConditionalStep,
    addLoopStep,
    addParallelStep,
  } = useWorkflow();
  const { actions } = useWorkflowActionsCatalog();
  const dialogs = useDialogs();
  const { mutate: deleteWorkflow } = useDelete(EntityType.WORKFLOW);
  const [graph, setGraph] = useState<WorkflowGraph>({
    nodes: [],
    edges: [],
  });
  const isEmptyWorkflow = graph.nodes.length < 3;
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
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const actionsDrawerId = "workflow-actions-drawer";
  const sharedInsertMenuId = "workflow-insert-menu";
  const publishLabel = t("button.publish");
  const unpublishLabel = t("button.unpublish");
  const {
    initialViewport,
    requestCenterAfterFirstInsert,
    clearCenterAfterFirstInsert,
    animateFocus,
  } = useWorkflowViewport({
    workflow,
    isEmptyWorkflow,
    graphNodes: graph.nodes,
  });
  const isCurrentVersionPublished =
    Boolean(workflow?.currentVersion) &&
    workflow?.currentVersion === workflow?.publishedVersion;
  const hasPublishedVersion = Boolean(workflow?.publishedVersion);
  const isPublishDisabled =
    !definition ||
    !workflow?.currentVersion ||
    isDefinitionDirty ||
    isDefinitionSaving ||
    isCurrentVersionPublished;
  const isUnpublishDisabled = !hasPublishedVersion || isDefinitionSaving;
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
      requestCenterAfterFirstInsert();
      handleInsert(insertType, null);
    },
    [handleInsert, requestCenterAfterFirstInsert],
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

    dialogs.open(
      WorkflowFormDialog,
      {
        defaultValues: null,
        presetValues: {
          definition: baseDefinition,
          definitionYaml: baseYaml,
          onCreated: (createdWorkflow) => {
            updateWorkflowURL(createdWorkflow.id);
          },
        },
      },
      { maxWidth: "lg" },
    );
  };
  const handleEditWorkflow = (workflowToEdit: IWorkflow) => {
    dialogs.open(
      WorkflowFormDialog,
      {
        defaultValues: workflowToEdit,
      },
      { maxWidth: "lg" },
    );
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
  const handleOpenSettingsDialog = () => {
    setSettingsDialogOpen(true);
  };
  const handleCloseSettingsDialog = () => {
    setSettingsDialogOpen(false);
  };
  const handleSaveWorkflowSettings = useCallback(
    (settings: Settings) => {
      if (!definition) {
        return;
      }

      updateDefinitionState({
        ...definition,
        defaults: {
          ...(definition.defaults ?? {}),
          settings,
        },
      });
      setSettingsDialogOpen(false);
    },
    [definition, updateDefinitionState],
  );

  return (
    <div className="visual-editor-v4">
      <FlowsDrawer onNew={handleNewWorkflow} onEdit={handleEditWorkflow} />
      <StyledBox>
        <ReactFlowWrapper
          onViewport={debouncedWorkflowUpdate}
          defaultEdges={edgesWithHandlers || []}
          defaultNodes={isEmptyWorkflow ? [] : nodesWithHandlers}
          defaultViewport={initialViewport}
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
              onSave={persistDefinition}
              saveDisabled={!definition || !isDefinitionDirty}
              saveLoading={isDefinitionSaving}
              saveLabel={t("button.save")}
              onOpenSettings={handleOpenSettingsDialog}
              settingsLabel={t("visual_editor.workflow_title_bar.settings.open")}
              settingsDisabled={!definition || isDefinitionSaving}
              renameLabel={t("button.rename")}
              moreLabel={t("button.more")}
            />
          </WorkflowTitleOverlay>
        )}
        {workflow && (
          <WorkflowPublishOverlay>
            <Stack direction="row" spacing={1}>
              {hasPublishedVersion && (
                <Button
                  variant="outlined"
                  size="large"
                  color="warning"
                  aria-label={unpublishLabel}
                  startIcon={<CloudOff />}
                  onClick={unpublishVersion}
                  disabled={isUnpublishDisabled}
                >
                  {unpublishLabel}
                </Button>
              )}
              <Button
                variant="contained"
                size="large"
                color="primary"
                aria-label={publishLabel}
                startIcon={<CloudUpload />}
                onClick={() => {
                  publishVersion();
                }}
                disabled={isPublishDisabled}
              >
                {publishLabel}
              </Button>
            </Stack>
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
            clearCenterAfterFirstInsert();
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
      <WorkflowSettingsDialog
        open={settingsDialogOpen}
        settings={definition?.defaults?.settings}
        onClose={handleCloseSettingsDialog}
        onSave={handleSaveWorkflowSettings}
        saveDisabled={!definition || isDefinitionSaving}
      />
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
