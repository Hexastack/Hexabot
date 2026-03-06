/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  type JsonValue,
  StepType,
  Workflow as WorkflowHelper,
  type Settings,
} from "@hexabot-ai/agentic";
import {
  ENodeType,
  WorkflowGraph,
  type EdgeInsertType,
  type FlowStepPath,
  type MemoryDefinition,
  type WorkflowBindingAddPayload,
  type WorkflowBindingRemovePayload,
  type WorkflowGraphColorMode,
  type WorkflowGraphHandle,
  type WorkflowSelectionSnapshot,
} from "@hexabot-ai/graph";
import { Box, Button, Stack, styled } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import type { Node, NodeMouseHandler } from "@xyflow/react";
import { CloudOff, CloudUpload } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";

import { ConfirmDialogBody } from "@/app-components/dialogs";
import { useWorkflowActionsCatalog } from "@/contexts/workflow-actions.context";
import { useWorkflowBindingsCatalog } from "@/contexts/workflow-bindings.context";
import { useDelete } from "@/hooks/crud/useDelete";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useDialogs } from "@/hooks/useDialogs";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import type { IAction } from "@/types/action.types";
import type { IWorkflow } from "@/types/workfow.types";

import { WorkflowFormDialog } from "../components/forms/WorkflowFormDialog";
import { ActionFormDrawer } from "../components/main/ActionDrawer/ActionFormDrawer/ActionFormDrawer";
import { ActionListDrawer } from "../components/main/ActionDrawer/ActionListDrawer";
import { ConditionalFormDrawer } from "../components/main/ConditionalDrawer/ConditionalFormDrawer";
import { FlowsDrawer } from "../components/main/FlowsDrawer";
import { LoopFormDrawer } from "../components/main/LoopDrawer/LoopFormDrawer";
import { ParallelFormDrawer } from "../components/main/ParallelDrawer/ParallelFormDrawer";
import {
  ToolFormDrawer,
  type ToolFormDrawerTarget,
} from "../components/main/ToolDrawer/ToolFormDrawer";
import { WorkflowBottomDrawer } from "../components/main/WorkflowBottomDrawer";
import { WorkflowMenu } from "../components/main/WorkflowMenu";
import { WorkflowTitleBar } from "../components/main/WorkflowTitleBar";
import { WorkflowSettingsDialog } from "../components/main/WorkflowTitleBar/WorkflowSettingsDialog";
import { useWorkflow } from "../hooks/useWorkflow";
import { useWorkflowExecutionState } from "../hooks/useWorkflowExecutionState";
import { getSchemaDefaults } from "../utils/schema-defaults.utils";
import {
  createUniqueToolBindingName,
  TOOL_BINDING_KIND,
} from "../utils/tool-bindings.utils";
import { createBaseDefinition } from "../utils/workflow-definition.utils";
import "./workflow-layout.css";

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
  const { mode } = useColorScheme();
  const { query } = useAppRouter();
  const { nodeIds } = query;
  const {
    workflow,
    workflows,
    selectedFlowId,
    direction,
    selectedNodeIds,
    debouncedWorkflowUpdate,
    updateWorkflow,
    updateWorkflowURL,
    definition,
    flow,
    isDefinitionDirty,
    isSaving: isDefinitionSaving,
    removeStepAtPath,
    setGraphSelection,
    updateDefinitionState,
    persistDefinition,
    publishVersion,
    unpublishVersion,
    addActionStep,
    addConditionalStep,
    addLoopStep,
    addParallelStep,
  } = useWorkflow();
  const { actions, actionsByName } = useWorkflowActionsCatalog();
  const { bindingsByName } = useWorkflowBindingsCatalog();
  const dialogs = useDialogs();
  const { mutate: deleteWorkflow } = useDelete(EntityType.WORKFLOW);
  const isEmptyWorkflow = !definition?.flow?.length;
  const [actionsDrawerOpen, setActionsDrawerOpen] = useState(false);
  const [pendingInsertPath, setPendingInsertPath] =
    useState<FlowStepPath | null>(null);
  const [pendingToolBindingAdd, setPendingToolBindingAdd] =
    useState<WorkflowBindingAddPayload | null>(null);
  const [toolDrawerTarget, setToolDrawerTarget] =
    useState<ToolFormDrawerTarget | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [menuFlowId, setMenuFlowId] = useState<string | null>(null);
  const actionsDrawerId = "workflow-actions-drawer";
  const publishLabel = t("button.publish");
  const unpublishLabel = t("button.unpublish");
  const graphColorMode: WorkflowGraphColorMode =
    mode === "light" || mode === "dark" ? mode : "system";
  const workflowGraphRef = useRef<WorkflowGraphHandle | null>(null);
  const executionStates = useWorkflowExecutionState(selectedFlowId);
  const focusNodeIds = useMemo(
    () =>
      typeof nodeIds === "string"
        ? nodeIds.split(",").filter(Boolean)
        : undefined,
    [nodeIds],
  );
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

      setPendingToolBindingAdd(null);
      setPendingInsertPath(insertPath ?? null);
      setActionsDrawerOpen(true);
    },
    [addConditionalStep, addLoopStep, addParallelStep],
  );
  const handleRootInsert = useCallback(
    (insertType: EdgeInsertType = "step") => {
      workflowGraphRef.current?.requestCenterAfterFirstInsert();
      handleInsert(insertType, null);
    },
    [handleInsert],
  );
  const handleActionSelect = useCallback(
    (action: IAction) => {
      if (pendingToolBindingAdd) {
        if (!definition) {
          return;
        }

        const nextToolName = createUniqueToolBindingName(
          action.name,
          definition.defs,
        );
        const toolSettingsDefaults =
          (getSchemaDefaults<Record<string, JsonValue>>(action.settingSchema) ??
            {}) as Record<string, unknown>;

        setToolDrawerTarget({
          mode: "create",
          taskName: pendingToolBindingAdd.taskName,
          bindingKind: TOOL_BINDING_KIND,
          actionName: action.name,
          initialBindingName: nextToolName,
          initialDescription: action.description?.trim() || undefined,
          initialSettings: toolSettingsDefaults,
        });
        setActionsDrawerOpen(false);
        setPendingInsertPath(null);
        setPendingToolBindingAdd(null);

        return;
      }

      addActionStep(action, pendingInsertPath);
      setActionsDrawerOpen(false);
      setPendingInsertPath(null);
    },
    [addActionStep, definition, pendingInsertPath, pendingToolBindingAdd],
  );
  const getMemoryDefinitionsFromCache = useGetFromCache(
    EntityType.MEMORY_DEFINITION,
  );
  const memoryDefinitions = useMemo(
    () =>
      (workflow?.memoryDefinitions ?? []).reduce<MemoryDefinition[]>(
        (acc, memoryDefinitionId) => {
          const memoryDefinition = getMemoryDefinitionsFromCache(
            memoryDefinitionId,
          ) as MemoryDefinition | undefined;

          if (memoryDefinition) {
            acc.push(memoryDefinition);
          }

          return acc;
        },
        [],
      ),
    [getMemoryDefinitionsFromCache, workflow?.memoryDefinitions],
  );

  useEffect(() => {
    if (!isEmptyWorkflow) {
      setActionsDrawerOpen(false);
    }
  }, [isEmptyWorkflow]);
  const handleSelectionChange = useCallback(
    (selection: WorkflowSelectionSnapshot) => {
      setGraphSelection(selection);
    },
    [setGraphSelection],
  );
  const handleRotate = useCallback(
    async (nextDirection: "horizontal" | "vertical") => {
      if (!selectedFlowId) {
        return false;
      }

      return new Promise<boolean>((resolve) => {
        updateWorkflow(
          {
            id: selectedFlowId,
            params: {
              direction: nextDirection,
            },
          },
          {
            onSuccess: () => {
              resolve(true);
            },
            onError: () => {
              resolve(false);
            },
          },
        );
      });
    },
    [selectedFlowId, updateWorkflow],
  );
  const translateGraph = useCallback(
    (key: string, options?: Record<string, unknown>) => {
      return t(
        key as Parameters<typeof t>[0],
        options as Parameters<typeof t>[1],
      );
    },
    [t],
  );
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
    },
    [definition, updateDefinitionState],
  );
  const handleOpenSettingsDialog = useCallback(() => {
    if (!definition) {
      return;
    }

    dialogs.open(
      WorkflowSettingsDialog,
      {
        defaultValues: definition.defaults?.settings,
        presetValues: {
          onSave: handleSaveWorkflowSettings,
          saveDisabled: isDefinitionSaving,
        },
      },
      { maxWidth: "sm" },
    );
  }, [definition, dialogs, handleSaveWorkflowSettings, isDefinitionSaving]);
  const handleAddBinding = useCallback(
    ({
      taskName,
      bindingKind,
      ...payload
    }: WorkflowBindingAddPayload) => {
      if (!definition || !definition.tasks[taskName]) {
        return;
      }

      if (bindingKind === TOOL_BINDING_KIND) {
        setPendingInsertPath(null);
        setPendingToolBindingAdd({
          ...payload,
          taskName,
          bindingKind,
        });
        setActionsDrawerOpen(true);

        return;
      }

      setPendingToolBindingAdd(null);
      const defsByKind = Object.entries(definition.defs ?? {}).reduce<string[]>(
        (acc, [defName, defDefinition]) => {
          if (defDefinition.kind === bindingKind) {
            acc.push(defName);
          }

          return acc;
        },
        [],
      );

      if (!defsByKind.length) {
        return;
      }

      const taskDefinition = definition.tasks[taskName];
      const currentRefs = taskDefinition.bindings?.[bindingKind] ?? [];
      const nextRef = defsByKind.find((refName) => !currentRefs.includes(refName));

      if (!nextRef) {
        return;
      }

      const nextDefinition = {
        ...definition,
        tasks: {
          ...definition.tasks,
          [taskName]: {
            ...taskDefinition,
            bindings: {
              ...(taskDefinition.bindings ?? {}),
              [bindingKind]: [...currentRefs, nextRef],
            },
          },
        },
      };

      updateDefinitionState(nextDefinition);
    },
    [definition, updateDefinitionState],
  );
  const handleGraphNodeClick = useCallback<NodeMouseHandler<Node>>(
    (_event, node) => {
      if (node.type !== ENodeType.TOOL) {
        return;
      }

      const nodeData =
        node.data && typeof node.data === "object"
          ? (node.data as Record<string, unknown>)
          : undefined;
      const bindingKind = nodeData?.bindingKind;
      const bindingName = nodeData?.bindingName;
      const taskName = nodeData?.taskName;

      if (
        bindingKind !== TOOL_BINDING_KIND ||
        typeof bindingName !== "string" ||
        typeof taskName !== "string"
      ) {
        return;
      }

      setToolDrawerTarget({
        mode: "edit",
        taskName,
        bindingKind: TOOL_BINDING_KIND,
        bindingName,
      });
    },
    [],
  );
  const handleRemoveBinding = useCallback(
    ({
      taskName,
      bindingKind,
      bindingName,
    }: WorkflowBindingRemovePayload) => {
      if (!definition || !definition.tasks[taskName]) {
        return;
      }

      const taskDefinition = definition.tasks[taskName];
      const currentRefs = taskDefinition.bindings?.[bindingKind] ?? [];

      if (!currentRefs.includes(bindingName)) {
        return;
      }

      const nextRefs = currentRefs.filter((refName) => refName !== bindingName);
      const nextBindings = { ...(taskDefinition.bindings ?? {}) };

      if (nextRefs.length > 0) {
        nextBindings[bindingKind] = nextRefs;
      } else {
        delete nextBindings[bindingKind];
      }

      const nextTaskDefinition =
        Object.keys(nextBindings).length > 0
          ? { ...taskDefinition, bindings: nextBindings }
          : (() => {
              const { bindings: _bindings, ...taskWithoutBindings } =
                taskDefinition;

              return taskWithoutBindings;
            })();
      const nextDefinition = {
        ...definition,
        tasks: {
          ...definition.tasks,
          [taskName]: nextTaskDefinition,
        },
      };

      updateDefinitionState(nextDefinition);
    },
    [definition, updateDefinitionState],
  );

  return (
    <div className="visual-editor-v4">
      <FlowsDrawer onNew={handleNewWorkflow} onEdit={handleEditWorkflow} />
      <StyledBox>
        <WorkflowGraph
          ref={workflowGraphRef}
          colorMode={graphColorMode}
          t={translateGraph}
          model={{
            definition,
            compiledFlow: flow,
            memoryDefinitions,
            actionCatalog: actionsByName,
            bindingCatalog: bindingsByName,
            executionStates,
            layoutDirection: direction,
          }}
          selection={{
            selectedNodeIds,
            focusNodeIds,
            onChange: handleSelectionChange,
          }}
          insertion={{
            onInsertAtPath: handleInsert,
            onInsertAtRoot: handleRootInsert,
          }}
          viewport={{
            value: {
              id: workflow?.id,
              x: workflow?.x,
              y: workflow?.y,
              zoom: workflow?.zoom,
            },
            onChange: debouncedWorkflowUpdate,
          }}
          callbacks={{
            onRemoveStep: removeStepAtPath,
            onAddBinding: handleAddBinding,
            onRemoveBinding: handleRemoveBinding,
            onNodeClick: handleGraphNodeClick,
            onRotate: handleRotate,
          }}
        />
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
              settingsLabel={t(
                "visual_editor.workflow_title_bar.settings.open",
              )}
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
            setPendingToolBindingAdd(null);
            workflowGraphRef.current?.clearCenterAfterFirstInsert();
          }}
        />
        <WorkflowBottomDrawer />
      </StyledBox>
      <ToolFormDrawer
        target={toolDrawerTarget}
        onClose={() => {
          setToolDrawerTarget(null);
        }}
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
