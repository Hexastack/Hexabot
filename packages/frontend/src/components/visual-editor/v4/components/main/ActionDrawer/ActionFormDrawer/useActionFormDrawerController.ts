/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  BaseSettingsSchema,
  DEFAULT_RETRY_SETTINGS,
  DEFAULT_TIMEOUT_MS,
  JsonValue,
  Settings,
  TaskDefinition,
  Workflow as WorkflowHelper,
  mergeSettings,
  type WorkflowDefinition,
} from "@hexabot-ai/agentic";
import { ENodeType, type GraphNode } from "@hexabot-ai/graph";
import { useReactFlow } from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";

import { useWorkflowActionsCatalog } from "@/contexts/workflow-actions.context";
import { useTranslate } from "@/hooks/useTranslate";
import { IAction } from "@/types/action.types";

import { useWorkflow } from "../../../../hooks/useWorkflow";
import { getSchemaPropertyNames } from "../../../../utils/schema-defaults.utils";

import type { ActionFormDrawerFooterProps } from "./ActionFormDrawerFooter";
import type { ActionFormDrawerHeaderProps } from "./ActionFormDrawerHeader";
import { useTaskIdentityController } from "./useTaskIdentityController";

type UseActionFormDrawerControllerResult = {
  actionSchema?: IAction;
  executionSettingsData: Record<string, unknown>;
  emptyStateLabel: string;
  footerProps: ActionFormDrawerFooterProps;
  headerProps: ActionFormDrawerHeaderProps;
  inputData: Record<string, unknown>;
  isUsingWorkflowExecutionDefaults: boolean;
  onExecutionSettingsDataChange: (data: Record<string, unknown>) => void;
  onExecutionSettingsModeChange: (useWorkflowDefaults: boolean) => void;
  onExecutionSettingsVisibleErrorsChange: (hasVisibleErrors: boolean) => void;
  onInputDataChange: (data: Record<string, unknown>) => void;
  onInputVisibleErrorsChange: (hasVisibleErrors: boolean) => void;
  onActionSettingsDataChange: (data: Record<string, unknown>) => void;
  onActionSettingsVisibleErrorsChange: (hasVisibleErrors: boolean) => void;
  open: boolean;
  panelKeyBase: string;
  actionSettingsData: Record<string, unknown>;
  onClose: () => void;
};

type SplitTaskSettingsResult = {
  actionSettings: Record<string, JsonValue>;
  executionSettings: Partial<Settings>;
  hasExecutionOverride: boolean;
};

const EXECUTION_SETTING_KEYS = new Set(Object.keys(BaseSettingsSchema.shape));
const DEFAULT_WORKFLOW_EXECUTION_SETTINGS: Partial<Settings> = {
  timeout_ms: DEFAULT_TIMEOUT_MS,
  retries: { ...DEFAULT_RETRY_SETTINGS },
};
const splitTaskSettings = (
  settings: Record<string, unknown> | undefined,
): SplitTaskSettingsResult => {
  const actionSettings: Record<string, JsonValue> = {};
  const executionSettings: Partial<Settings> = {};

  if (!settings) {
    return {
      actionSettings,
      executionSettings,
      hasExecutionOverride: false,
    };
  }

  for (const [key, value] of Object.entries(settings)) {
    if (EXECUTION_SETTING_KEYS.has(key)) {
      executionSettings[key as keyof Settings] = value as JsonValue;
      continue;
    }

    actionSettings[key] = value as JsonValue;
  }

  return {
    actionSettings,
    executionSettings,
    hasExecutionOverride: Object.keys(executionSettings).length > 0,
  };
};

export const useActionFormDrawerController =
  (): UseActionFormDrawerControllerResult => {
    const { t } = useTranslate();
    const {
      selectedNodeIds,
      selectedFlowId,
      updateWorkflowURL,
      definition,
      updateDefinitionState,
      isSaving,
    } = useWorkflow();
    const { actionsByName } = useWorkflowActionsCatalog();
    const { getNode } = useReactFlow();
    const selectedNodeId =
      selectedNodeIds.length === 1 ? selectedNodeIds[0] : undefined;
    const selectedNode = selectedNodeId
      ? (getNode(selectedNodeId) as GraphNode | undefined)
      : undefined;
    const isActionNode =
      selectedNode?.type === ENodeType.TASK ||
      selectedNode?.type === ENodeType.AGENT;
    const actionName = (selectedNode?.data as { actionName?: string })
      ?.actionName;
    const taskName = isActionNode
      ? (selectedNode?.data as { title?: string })?.title
      : undefined;
    const actionSchema = actionName ? actionsByName.get(actionName) : undefined;
    const taskDefinition = taskName ? definition?.tasks?.[taskName] : undefined;
    const [inputData, setInputData] = useState<Record<string, unknown>>({});
    const [actionSettingsData, setActionSettingsData] = useState<
      Record<string, unknown>
    >({});
    const [executionSettingsData, setExecutionSettingsData] = useState<
      Record<string, unknown>
    >({});
    const [
      isUsingWorkflowExecutionDefaults,
      setIsUsingWorkflowExecutionDefaults,
    ] = useState(true);
    const [hasInputVisibleErrors, setHasInputVisibleErrors] = useState(false);
    const [hasActionSettingsVisibleErrors, setHasActionSettingsVisibleErrors] =
      useState(false);
    const [hasExecutionSettingsVisibleErrors, setHasExecutionSettingsVisibleErrors] =
      useState(false);
    const open = Boolean(isActionNode && selectedNodeId);
    const panelKeyBase = selectedNodeId ?? actionName ?? "action";
    const hasInputSchema = useMemo(
      () =>
        getSchemaPropertyNames(
          actionSchema?.inputSchema as Record<string, unknown>,
        ).length > 0,
      [actionSchema?.inputSchema],
    );
    const hasActionSettingsSchema = useMemo(
      () =>
        getSchemaPropertyNames(
          actionSchema?.settingSchema as Record<string, unknown>,
        ).length > 0,
      [actionSchema?.settingSchema],
    );
    const workflowExecutionSettingsDefaults = useMemo<Partial<Settings>>(() => {
      const { executionSettings } = splitTaskSettings(
        definition?.defaults?.settings as Record<string, unknown> | undefined,
      );

      return mergeSettings(
        DEFAULT_WORKFLOW_EXECUTION_SETTINGS,
        executionSettings,
      ) as Partial<Settings>;
    }, [definition?.defaults?.settings]);
    const {
      taskNameValue,
      taskDescriptionValue,
      normalizedTaskName,
      taskNameValidationError,
      handleTaskNameCommit,
      handleTaskNameCancel,
      handleDescriptionCommit,
      handleDescriptionCancel,
    } = useTaskIdentityController({
      open,
      actionName,
      taskName,
      taskDescription: taskDefinition?.description,
      tasks: definition?.tasks,
    });

    useEffect(() => {
      if (!open) {
        return;
      }

      const { actionSettings, executionSettings, hasExecutionOverride } =
        splitTaskSettings(
          taskDefinition?.settings as Record<string, unknown> | undefined,
        );
      const resolvedExecutionSettings = hasExecutionOverride
        ? (mergeSettings(
            workflowExecutionSettingsDefaults,
            executionSettings,
          ) as Record<string, unknown>)
        : (workflowExecutionSettingsDefaults as Record<string, unknown>);

      setInputData((taskDefinition?.inputs as Record<string, unknown>) ?? {});
      setActionSettingsData(actionSettings);
      setExecutionSettingsData(resolvedExecutionSettings);
      setIsUsingWorkflowExecutionDefaults(!hasExecutionOverride);
      setHasExecutionSettingsVisibleErrors(false);
    }, [
      actionName,
      open,
      taskDefinition?.inputs,
      taskDefinition?.settings,
      taskName,
      workflowExecutionSettingsDefaults,
    ]);

    useEffect(() => {
      if (open) {
        return;
      }

      setHasInputVisibleErrors(false);
      setHasActionSettingsVisibleErrors(false);
      setHasExecutionSettingsVisibleErrors(false);
    }, [open]);

    useEffect(() => {
      if (!hasInputSchema) {
        setHasInputVisibleErrors(false);
      }
    }, [hasInputSchema]);

    useEffect(() => {
      if (!hasActionSettingsSchema) {
        setHasActionSettingsVisibleErrors(false);
      }
    }, [hasActionSettingsSchema]);

    useEffect(() => {
      if (isUsingWorkflowExecutionDefaults) {
        setHasExecutionSettingsVisibleErrors(false);
      }
    }, [isUsingWorkflowExecutionDefaults]);

    const handleClose = () => {
      if (selectedFlowId) {
        updateWorkflowURL(selectedFlowId);
      }
    };
    const handleExecutionSettingsModeChange = (
      useWorkflowDefaults: boolean,
    ) => {
      setIsUsingWorkflowExecutionDefaults(useWorkflowDefaults);
      if (useWorkflowDefaults) {
        return;
      }

      setExecutionSettingsData((current) => {
        if (Object.keys(current).length > 0) {
          return current;
        }

        return workflowExecutionSettingsDefaults as Record<string, unknown>;
      });
    };
    const handleExecutionSettingsVisibleErrorsChange = (
      hasVisibleErrors: boolean,
    ) => {
      setHasExecutionSettingsVisibleErrors(
        isUsingWorkflowExecutionDefaults ? false : hasVisibleErrors,
      );
    };
    const handleSave = () => {
      if (!definition || !taskName) {
        return;
      }

      if (
        hasInputVisibleErrors ||
        hasActionSettingsVisibleErrors ||
        hasExecutionSettingsVisibleErrors
      ) {
        return;
      }

      const nextTaskName = normalizedTaskName;

      if (!nextTaskName || taskNameValidationError) {
        return;
      }

      if (
        nextTaskName !== taskName &&
        Object.prototype.hasOwnProperty.call(definition.tasks, nextTaskName)
      ) {
        return;
      }

      const currentTask = definition.tasks?.[taskName];

      if (!currentTask) {
        return;
      }

      const normalizedDescription = taskDescriptionValue.trim();
      const hasInputValues = Object.keys(inputData).length > 0;
      const nextSettingsData: Record<string, JsonValue> = {
        ...(actionSettingsData as Record<string, JsonValue>),
        ...(isUsingWorkflowExecutionDefaults
          ? {}
          : (executionSettingsData as Record<string, JsonValue>)),
      };
      const hasSettingValues = Object.keys(nextSettingsData).length > 0;
      const shouldIncludeInputs =
        hasInputValues || currentTask.inputs !== undefined;
      const shouldIncludeSettings =
        hasSettingValues || currentTask.settings !== undefined;
      const nextTask: TaskDefinition = {
        ...currentTask,
        ...(normalizedDescription ? { description: normalizedDescription } : {}),
        ...(shouldIncludeInputs
          ? { inputs: inputData as Record<string, JsonValue> }
          : {}),
        ...(shouldIncludeSettings
          ? { settings: nextSettingsData as TaskDefinition["settings"] }
          : {}),
      };
      let nextDefinition: WorkflowDefinition = {
        ...definition,
        tasks: {
          ...(definition.tasks ?? {}),
          [taskName]: nextTask,
        },
      };

      if (!normalizedDescription) {
        delete nextDefinition.tasks[taskName].description;
      }

      if (nextTaskName !== taskName) {
        nextDefinition = WorkflowHelper.safeRenameTaskInDefinition(
          nextDefinition,
          taskName,
          nextTaskName,
        );
      }

      updateDefinitionState(nextDefinition);
      handleClose();
    };
    const saveDisabled =
      hasInputVisibleErrors ||
      hasActionSettingsVisibleErrors ||
      hasExecutionSettingsVisibleErrors ||
      !definition ||
      !taskName ||
      !isActionNode ||
      !taskDefinition ||
      isSaving ||
      Boolean(taskNameValidationError);

    return {
      actionSchema,
      executionSettingsData,
      emptyStateLabel: actionName
        ? t("visual_editor.actions_drawer.form.empty_state.no_schema")
        : t("visual_editor.actions_drawer.form.empty_state.no_action"),
      footerProps: {
        saveDisabled,
        onSave: handleSave,
      },
      headerProps: {
        taskNameValue,
        taskNameValidationError,
        taskDescriptionValue,
        taskName,
        isSaving,
        onTaskNameCommit: handleTaskNameCommit,
        onTaskNameCancel: handleTaskNameCancel,
        onDescriptionCommit: handleDescriptionCommit,
        onDescriptionCancel: handleDescriptionCancel,
      },
      inputData,
      isUsingWorkflowExecutionDefaults,
      onExecutionSettingsDataChange: setExecutionSettingsData,
      onExecutionSettingsModeChange: handleExecutionSettingsModeChange,
      onExecutionSettingsVisibleErrorsChange:
        handleExecutionSettingsVisibleErrorsChange,
      onInputDataChange: setInputData,
      onInputVisibleErrorsChange: setHasInputVisibleErrors,
      onActionSettingsDataChange: setActionSettingsData,
      onActionSettingsVisibleErrorsChange: setHasActionSettingsVisibleErrors,
      open,
      panelKeyBase,
      actionSettingsData,
      onClose: handleClose,
    };
  };
