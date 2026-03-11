/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  StepType,
  Workflow as WorkflowHelper,
  type JsonValue,
  type Settings,
} from "@hexabot-ai/agentic";
import {
  ENodeType,
  WorkflowGraph,
  type EdgeInsertType,
  type FlowStepPath,
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
import { SingleBindingSelectionDrawer } from "../components/main/SingleBindingDrawer/SingleBindingSelectionDrawer";
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
import {
  humanizeBindingKind,
  isSingleBindingKind,
} from "../utils/binding-kind.utils";
import {
  createUniqueBindingName,
  normalizeBindingName,
} from "../utils/binding-name.utils";
import { getSchemaDefaults } from "../utils/schema-defaults.utils";
import {
  mountTaskBindingRef,
  setTaskBindingRefs,
  toBindingRefs,
  unmountTaskBindingRef,
} from "../utils/task-bindings.utils";
import {
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

type EditingSingleBindingTarget = {
  bindingKind: string;
  bindingName: string;
};

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
  const [pendingSingleBindingAdd, setPendingSingleBindingAdd] =
    useState<WorkflowBindingAddPayload | null>(null);
  const [editingSingleBindingTarget, setEditingSingleBindingTarget] =
    useState<EditingSingleBindingTarget | null>(null);
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
  const activeSingleBindingKind =
    editingSingleBindingTarget?.bindingKind ?? pendingSingleBindingAdd?.bindingKind;
  const activeSingleBindingLabel = useMemo(
    () => humanizeBindingKind(activeSingleBindingKind ?? ""),
    [activeSingleBindingKind],
  );
  const availableSingleBindingDefs = useMemo(() => {
    if (!activeSingleBindingKind) {
      return [];
    }

    return Object.entries(definition?.defs ?? {})
      .filter(([, defDefinition]) => defDefinition.kind === activeSingleBindingKind)
      .map(([defName]) => defName)
      .sort();
  }, [activeSingleBindingKind, definition?.defs]);
  const activeSingleBindingSchema = activeSingleBindingKind
    ? bindingsByName.get(activeSingleBindingKind)?.schema
    : undefined;
  const isSingleBindingDrawerOpen = Boolean(
    activeSingleBindingKind &&
      (pendingSingleBindingAdd || editingSingleBindingTarget),
  );
  const handleInsert = useCallback(
    (insertType: EdgeInsertType = "step", insertPath?: FlowStepPath | null) => {
      setPendingSingleBindingAdd(null);
      setEditingSingleBindingTarget(null);

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

        const nextToolName = createUniqueBindingName(
          normalizeBindingName(action.name) || "tool",
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
        setEditingSingleBindingTarget(null);

        return;
      }

      addActionStep(action, pendingInsertPath);
      setActionsDrawerOpen(false);
      setPendingInsertPath(null);
      setPendingSingleBindingAdd(null);
      setEditingSingleBindingTarget(null);
    },
    [addActionStep, definition, pendingInsertPath, pendingToolBindingAdd],
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
        setPendingSingleBindingAdd(null);
        setEditingSingleBindingTarget(null);
        setPendingToolBindingAdd({
          ...payload,
          taskName,
          bindingKind,
        });
        setActionsDrawerOpen(true);

        return;
      }

      const bindingDefinition = bindingsByName.get(bindingKind);

      if (!bindingDefinition) {
        return;
      }

      if (isSingleBindingKind(bindingKind, bindingsByName)) {
        setPendingInsertPath(null);
        setPendingToolBindingAdd(null);
        setEditingSingleBindingTarget(null);
        setPendingSingleBindingAdd({
          ...payload,
          taskName,
          bindingKind,
        });

        return;
      }

      setPendingSingleBindingAdd(null);
      setPendingToolBindingAdd(null);
      setEditingSingleBindingTarget(null);
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
      const multiple = bindingDefinition.multiple ?? true;
      const currentRefs = toBindingRefs(
        taskDefinition.bindings?.[bindingKind],
        multiple,
      );

      if (!multiple && currentRefs.length > 0) {
        return;
      }

      const nextRef = multiple
        ? defsByKind.find((refName) => !currentRefs.includes(refName))
        : defsByKind[0];

      if (!nextRef) {
        return;
      }

      const nextTaskDefinition = mountTaskBindingRef(
        taskDefinition,
        bindingKind,
        nextRef,
        multiple,
      );
      const nextDefinition = {
        ...definition,
        tasks: {
          ...definition.tasks,
          [taskName]: nextTaskDefinition,
        },
      };

      updateDefinitionState(nextDefinition);
    },
    [bindingsByName, definition, updateDefinitionState],
  );
  const handleSelectSingleBinding = useCallback(
    (bindingName: string) => {
      if (!pendingSingleBindingAdd || !definition) {
        return;
      }

      const { taskName, bindingKind } = pendingSingleBindingAdd;
      const taskDefinition = definition.tasks[taskName];

      if (!taskDefinition) {
        return;
      }

      const bindingDefinition = bindingsByName.get(bindingKind);

      if (!bindingDefinition) {
        return;
      }

      const multiple = bindingDefinition.multiple ?? true;
      const nextTaskDefinition = mountTaskBindingRef(
        taskDefinition,
        bindingKind,
        bindingName,
        multiple,
      );

      if (nextTaskDefinition === taskDefinition) {
        setPendingSingleBindingAdd(null);

        return;
      }

      const nextDefinition = {
        ...definition,
        tasks: {
          ...definition.tasks,
          [taskName]: nextTaskDefinition,
        },
      };

      updateDefinitionState(nextDefinition);
      setPendingSingleBindingAdd(null);
      setEditingSingleBindingTarget(null);
    },
    [bindingsByName, definition, pendingSingleBindingAdd, updateDefinitionState],
  );
  const handleCreateSingleBindingDefinition = useCallback(
    (
      bindingName: string,
      bindingDefinitionPayload: Record<string, unknown>,
      description?: string,
    ) => {
      if (!pendingSingleBindingAdd || !definition) {
        return;
      }

      if (Object.prototype.hasOwnProperty.call(definition.defs ?? {}, bindingName)) {
        return;
      }

      const { taskName, bindingKind } = pendingSingleBindingAdd;
      const taskDefinition = definition.tasks[taskName];

      if (!taskDefinition) {
        return;
      }

      const bindingDefinition = bindingsByName.get(bindingKind);

      if (!bindingDefinition) {
        return;
      }

      const multiple = bindingDefinition.multiple ?? true;
      const nextTaskDefinition = mountTaskBindingRef(
        taskDefinition,
        bindingKind,
        bindingName,
        multiple,
      );

      if (nextTaskDefinition === taskDefinition) {
        setPendingSingleBindingAdd(null);

        return;
      }
      const normalizedDescription = description?.trim() ?? "";
      const nextDefinition = {
        ...definition,
        defs: {
          ...(definition.defs ?? {}),
          [bindingName]: {
            ...bindingDefinitionPayload,
            kind: bindingKind,
            ...(normalizedDescription
              ? { description: normalizedDescription }
              : {}),
          } as { [key: string]: unknown; kind: string },
        },
        tasks: {
          ...definition.tasks,
          [taskName]: nextTaskDefinition,
        },
      };

      updateDefinitionState(nextDefinition);
      setPendingSingleBindingAdd(null);
      setEditingSingleBindingTarget(null);
    },
    [bindingsByName, definition, pendingSingleBindingAdd, updateDefinitionState],
  );
  const handleUpdateSingleBindingDefinition = useCallback(
    (
      currentBindingName: string,
      nextBindingName: string,
      bindingDefinitionPayload: Record<string, unknown>,
      description?: string,
    ) => {
      if (!definition || !editingSingleBindingTarget) {
        return;
      }

      const { bindingKind } = editingSingleBindingTarget;
      const currentDefs = definition.defs ?? {};
      const currentDef = currentDefs[currentBindingName];

      if (!currentDef || currentDef.kind !== bindingKind) {
        return;
      }

      if (
        currentBindingName !== nextBindingName &&
        Object.prototype.hasOwnProperty.call(currentDefs, nextBindingName)
      ) {
        return;
      }

      const normalizedDescription = description?.trim() ?? "";
      const nextDefs = { ...currentDefs };

      if (currentBindingName !== nextBindingName) {
        delete nextDefs[currentBindingName];
      }

      nextDefs[nextBindingName] = {
        ...bindingDefinitionPayload,
        kind: bindingKind,
        ...(normalizedDescription
          ? { description: normalizedDescription }
          : {}),
      } as { [key: string]: unknown; kind: string };

      const bindingDefinition = bindingsByName.get(bindingKind);
      const multiple = bindingDefinition?.multiple ?? false;
      const nextTasks =
        currentBindingName !== nextBindingName
          ? (Object.fromEntries(
              Object.entries(definition.tasks).map(
                ([taskName, taskDefinition]) => {
                  const refs = toBindingRefs(
                    taskDefinition.bindings?.[bindingKind],
                    multiple,
                  );

                  if (!refs.includes(currentBindingName)) {
                    return [taskName, taskDefinition];
                  }

                  const replacedRefs = refs.map((refName) =>
                    refName === currentBindingName ? nextBindingName : refName,
                  );
                  const dedupedRefs = Array.from(new Set(replacedRefs));

                  return [
                    taskName,
                    setTaskBindingRefs(
                      taskDefinition,
                      bindingKind,
                      dedupedRefs,
                      multiple,
                    ),
                  ];
                },
              ),
            ) as typeof definition.tasks)
          : definition.tasks;

      updateDefinitionState({
        ...definition,
        defs: nextDefs,
        tasks: nextTasks,
      });
      setEditingSingleBindingTarget(null);
      setPendingSingleBindingAdd(null);
    },
    [
      bindingsByName,
      definition,
      editingSingleBindingTarget,
      updateDefinitionState,
    ],
  );
  const handleCloseSingleBindingDrawer = useCallback(() => {
    setPendingSingleBindingAdd(null);
    setEditingSingleBindingTarget(null);
  }, []);
  const handleGraphNodeClick = useCallback<NodeMouseHandler<Node>>(
    (_event, node) => {
      if (
        node.type !== ENodeType.BINDING_MULTI &&
        node.type !== ENodeType.BINDING_SINGLE
      ) {
        return;
      }

      const nodeData =
        node.data && typeof node.data === "object"
          ? (node.data as Record<string, unknown>)
          : undefined;
      const bindingKind = nodeData?.bindingKind;
      const bindingName = nodeData?.bindingName;
      const taskName = nodeData?.taskName;

      if (node.type === ENodeType.BINDING_MULTI) {
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
        setEditingSingleBindingTarget(null);

        return;
      }

      if (typeof bindingKind !== "string" || typeof bindingName !== "string") {
        return;
      }

      if (!isSingleBindingKind(bindingKind, bindingsByName)) {
        return;
      }

      setPendingSingleBindingAdd(null);
      setPendingToolBindingAdd(null);
      setToolDrawerTarget(null);
      setEditingSingleBindingTarget({
        bindingKind,
        bindingName,
      });
    },
    [bindingsByName],
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
      const bindingDefinition = bindingsByName.get(bindingKind);

      if (!bindingDefinition) {
        return;
      }

      const multiple = bindingDefinition.multiple ?? true;
      const currentRefs = toBindingRefs(
        taskDefinition.bindings?.[bindingKind],
        multiple,
      );

      if (!currentRefs.includes(bindingName)) {
        return;
      }

      const nextTaskDefinition = unmountTaskBindingRef(
        taskDefinition,
        bindingKind,
        bindingName,
        multiple,
      );
      const nextDefinition = {
        ...definition,
        tasks: {
          ...definition.tasks,
          [taskName]: nextTaskDefinition,
        },
      };

      updateDefinitionState(nextDefinition);
    },
    [bindingsByName, definition, updateDefinitionState],
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
            setPendingSingleBindingAdd(null);
            setEditingSingleBindingTarget(null);
            workflowGraphRef.current?.clearCenterAfterFirstInsert();
          }}
        />
        <WorkflowBottomDrawer />
      </StyledBox>
      <SingleBindingSelectionDrawer
        drawerId="workflow-single-bindings-drawer"
        open={isSingleBindingDrawerOpen}
        availableBindings={availableSingleBindingDefs}
        bindingKind={activeSingleBindingKind ?? ""}
        bindingLabel={activeSingleBindingLabel}
        defs={definition?.defs}
        bindingSchema={activeSingleBindingSchema}
        editingBindingName={editingSingleBindingTarget?.bindingName}
        isSaving={isDefinitionSaving}
        onSelectBinding={handleSelectSingleBinding}
        onCreateBindingDefinition={handleCreateSingleBindingDefinition}
        onUpdateBindingDefinition={handleUpdateSingleBindingDefinition}
        onClose={handleCloseSingleBindingDrawer}
      />
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
