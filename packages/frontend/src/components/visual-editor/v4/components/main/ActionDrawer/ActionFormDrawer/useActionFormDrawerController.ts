/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  JsonValue,
  TaskDefinition,
  Workflow as WorkflowHelper,
  type WorkflowDefinition,
} from "@hexabot-ai/agentic";
import { useReactFlow } from "@xyflow/react";
import { useEffect, useState } from "react";

import { useWorkflowActionsCatalog } from "@/contexts/workflow-actions.context";
import { useTranslate } from "@/hooks/useTranslate";
import { IAction } from "@/types/action.types";

import { useWorkflow } from "../../../../hooks/useWorkflow";
import {
  ENodeType,
  type GraphNode,
} from "../../../../types/workflow-node.types";

import type { ActionFormDrawerFooterProps } from "./ActionFormDrawerFooter";
import type { ActionFormDrawerHeaderProps } from "./ActionFormDrawerHeader";
import { useTaskIdentityController } from "./useTaskIdentityController";

type UseActionFormDrawerControllerResult = {
  actionSchema?: IAction;
  emptyStateLabel: string;
  footerProps: ActionFormDrawerFooterProps;
  headerProps: ActionFormDrawerHeaderProps;
  inputData: Record<string, unknown>;
  onInputDataChange: (data: Record<string, unknown>) => void;
  onInputVisibleErrorsChange: (hasVisibleErrors: boolean) => void;
  onSettingsDataChange: (data: Record<string, unknown>) => void;
  onSettingsVisibleErrorsChange: (hasVisibleErrors: boolean) => void;
  open: boolean;
  panelKeyBase: string;
  settingsData: Record<string, unknown>;
  onClose: () => void;
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
    const [settingsData, setSettingsData] = useState<Record<string, unknown>>(
      {},
    );
    const [hasInputVisibleErrors, setHasInputVisibleErrors] = useState(false);
    const [hasSettingsVisibleErrors, setHasSettingsVisibleErrors] =
      useState(false);
    const open = Boolean(isActionNode && selectedNodeId);
    const panelKeyBase = selectedNodeId ?? actionName ?? "action";
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
      setInputData((taskDefinition?.inputs as Record<string, unknown>) ?? {});
      setSettingsData(
        (taskDefinition?.settings as Record<string, unknown>) ?? {},
      );
    }, [open, taskName, actionName]);

    useEffect(() => {
      if (open) {
        return;
      }

      setHasInputVisibleErrors(false);
      setHasSettingsVisibleErrors(false);
    }, [open]);

    useEffect(() => {
      if (actionSchema?.inputSchema) {
        return;
      }

      setHasInputVisibleErrors(false);
    }, [actionSchema?.inputSchema]);

    useEffect(() => {
      if (actionSchema?.settingSchema) {
        return;
      }

      setHasSettingsVisibleErrors(false);
    }, [actionSchema?.settingSchema]);

    const handleClose = () => {
      if (selectedFlowId) {
        updateWorkflowURL(selectedFlowId);
      }
    };
    const handleSave = () => {
      if (!definition || !taskName) {
        return;
      }

      if (hasInputVisibleErrors || hasSettingsVisibleErrors) {
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
      const hasSettingValues = Object.keys(settingsData).length > 0;
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
          ? { settings: settingsData as TaskDefinition["settings"] }
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
      hasSettingsVisibleErrors ||
      !definition ||
      !taskName ||
      !isActionNode ||
      !taskDefinition ||
      isSaving ||
      Boolean(taskNameValidationError);

    return {
      actionSchema,
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
      onInputDataChange: setInputData,
      onInputVisibleErrorsChange: setHasInputVisibleErrors,
      onSettingsDataChange: setSettingsData,
      onSettingsVisibleErrorsChange: setHasSettingsVisibleErrors,
      open,
      panelKeyBase,
      settingsData,
      onClose: handleClose,
    };
  };
