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
import { Box, Button, Stack, Typography } from "@mui/material";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import { useReactFlow } from "@xyflow/react";
import { Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { withDrawerLayout } from "@/app-components/drawers/DrawerLayout";
import { EditableTypography } from "@/app-components/inputs/EditableTypography";
import { useWorkflowActionsCatalog } from "@/contexts/workflow-actions.context";
import { useTranslate } from "@/hooks/useTranslate";
import { IAction } from "@/types/action.types";

import { useWorkflow } from "../../../hooks/useWorkflow";
import { ENodeType, type GraphNode } from "../../../types/workflow-node.types";
import {
  extractUiSchema,
  getSchemaPropertyNames,
} from "../../../utils/schema-defaults.utils";
import { normalizeTaskName } from "../../../utils/workflow-definition.utils";

import { ActionSchemaPanel } from "./ActionSchemaPanel";

type ActionFormDrawerContentProps = {
  isOpen: boolean;
  actionSchema?: IAction;
  inputData: Record<string, unknown>;
  settingsData: Record<string, unknown>;
  panelKeyBase: string;
  emptyStateLabel: string;
  onInputDataChange: (data: Record<string, unknown>) => void;
  onSettingsDataChange: (data: Record<string, unknown>) => void;
};

const COMMON_SETTING_KEYS = [
  "timeout_ms",
  "retries",
  "guardrails",
  "audit",
] as const;
const buildSettingsUiSchema = (schema?: RJSFSchema): UiSchema | undefined => {
  const properties = getSchemaPropertyNames(schema);

  if (properties.length === 0) {
    return undefined;
  }

  const commonSet = new Set<string>(COMMON_SETTING_KEYS);
  const actionSpecific = properties.filter((key) => !commonSet.has(key));
  const commonOrdered = COMMON_SETTING_KEYS.filter((key) =>
    properties.includes(key),
  );
  const uiSchema: UiSchema = {
    ...extractUiSchema(schema),
    "ui:order": [...actionSpecific, ...commonOrdered, "*"],
  };

  if (properties.includes("retries")) {
    uiSchema.retries = {
      "ui:options": { collapsible: true, defaultExpanded: false },
    };
  }

  if (properties.includes("guardrails")) {
    uiSchema.guardrails = {
      "ui:options": { collapsible: true, defaultExpanded: false },
    };
  }

  return uiSchema;
};
const ActionFormDrawerContent = ({
  isOpen,
  actionSchema,
  inputData,
  settingsData,
  panelKeyBase,
  emptyStateLabel,
  onInputDataChange,
  onSettingsDataChange,
}: ActionFormDrawerContentProps) => {
  const { t } = useTranslate();

  if (!isOpen || !Object.keys(inputData).length) return null;

  if (!actionSchema) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyStateLabel}
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      {actionSchema.inputSchema ? (
        <ActionSchemaPanel
          title={t("visual_editor.actions_drawer.form.section.input")}
          schema={actionSchema.inputSchema}
          formData={inputData}
          onFormDataChange={onInputDataChange}
          panelKey={`${panelKeyBase}-input`}
          emptyLabel={t("visual_editor.actions_drawer.form.empty_schema.input")}
          uiSchema={extractUiSchema(actionSchema?.inputSchema as RJSFSchema)}
        />
      ) : null}
      {actionSchema.settingSchema ? (
        <ActionSchemaPanel
          title={t("visual_editor.actions_drawer.form.section.settings")}
          schema={actionSchema.settingSchema}
          formData={settingsData}
          onFormDataChange={onSettingsDataChange}
          panelKey={`${panelKeyBase}-settings`}
          emptyLabel={t(
            "visual_editor.actions_drawer.form.empty_schema.settings",
          )}
          uiSchema={buildSettingsUiSchema(
            actionSchema?.settingSchema as RJSFSchema | undefined,
          )}
        />
      ) : null}
    </Stack>
  );
};
const ActionFormDrawerLayout = withDrawerLayout(ActionFormDrawerContent);

export const ActionFormDrawer = () => {
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
  const [settingsData, setSettingsData] = useState<Record<string, unknown>>({});
  const [taskNameValue, setTaskNameValue] = useState("");
  const [taskDescriptionValue, setTaskDescriptionValue] = useState("");
  const open = Boolean(isActionNode && selectedNodeId);
  const panelKeyBase = selectedNodeId ?? actionName ?? "action";
  const normalizedTaskName = useMemo(
    () => normalizeTaskName(taskNameValue),
    [taskNameValue],
  );
  const taskNameValidationError = useMemo(() => {
    if (!taskName) {
      return null;
    }

    if (!taskNameValue.trim()) {
      return t("visual_editor.actions_drawer.form.step_id.errors.required");
    }

    if (!normalizedTaskName) {
      return t("visual_editor.actions_drawer.form.step_id.errors.snake_case");
    }

    if (
      normalizedTaskName !== taskName &&
      Object.prototype.hasOwnProperty.call(
        definition?.tasks ?? {},
        normalizedTaskName,
      )
    ) {
      return t("visual_editor.actions_drawer.form.step_id.errors.unique");
    }

    return null;
  }, [definition?.tasks, normalizedTaskName, taskName, taskNameValue, t]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setInputData((taskDefinition?.inputs as Record<string, unknown>) ?? {});
    setSettingsData(
      (taskDefinition?.settings as Record<string, unknown>) ?? {},
    );
    setTaskNameValue(taskName ?? "");
    setTaskDescriptionValue(taskDefinition?.description ?? "");
  }, [open, taskName, actionName]);

  const handleClose = () => {
    if (selectedFlowId) {
      updateWorkflowURL(selectedFlowId);
    }
  };
  const handleTaskNameCommit = useCallback((nextTaskName: string) => {
    const nextNormalizedTaskName = normalizeTaskName(nextTaskName);

    setTaskNameValue(nextNormalizedTaskName || "");
  }, []);
  const handleTaskNameCancel = useCallback(() => {
    setTaskNameValue(taskName ?? "");
  }, [taskName]);
  const handleDescriptionCommit = useCallback((nextDescription: string) => {
    setTaskDescriptionValue(nextDescription);
  }, []);
  const handleDescriptionCancel = useCallback(() => {
    setTaskDescriptionValue(taskDefinition?.description ?? "");
  }, [taskDefinition?.description]);
  const handleSave = () => {
    if (!definition || !taskName) {
      return;
    }

    const nextTaskName = normalizeTaskName(taskNameValue);

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
    !definition ||
    !taskName ||
    !isActionNode ||
    !taskDefinition ||
    isSaving ||
    Boolean(taskNameValidationError);

  return (
    <ActionFormDrawerLayout
      isOpen={open}
      actionSchema={actionSchema}
      inputData={inputData}
      settingsData={settingsData}
      panelKeyBase={panelKeyBase}
      emptyStateLabel={
        actionName
          ? t("visual_editor.actions_drawer.form.empty_state.no_schema")
          : t("visual_editor.actions_drawer.form.empty_state.no_action")
      }
      onInputDataChange={setInputData}
      onSettingsDataChange={setSettingsData}
      open={open}
      onClose={handleClose}
      headerContent={
        <Stack spacing={0.25} minWidth={0}>
          <EditableTypography
            component="div"
            variant="subtitle1"
            value={taskNameValue}
            onCommit={handleTaskNameCommit}
            onCancel={handleTaskNameCancel}
            placeholder={t(
              "visual_editor.actions_drawer.form.step_id.placeholder",
            )}
            disabled={!taskName || isSaving}
            sx={{
              fontFamily: "monospace",
            }}
          />
          {taskNameValidationError ? (
            <Typography variant="caption" color="error.main">
              {taskNameValidationError}
            </Typography>
          ) : null}
          <EditableTypography
            component="div"
            variant="body2"
            multiline
            value={taskDescriptionValue}
            onCommit={handleDescriptionCommit}
            onCancel={handleDescriptionCancel}
            placeholder={t(
              "visual_editor.actions_drawer.form.description.placeholder",
            )}
            disabled={!taskName || isSaving}
            color={
              taskDescriptionValue.trim() ? "text.primary" : "text.secondary"
            }
          />
        </Stack>
      }
      footerContent={
        <Box display="flex" justifyContent="center">
          <Button
            variant="contained"
            size="large"
            onClick={handleSave}
            disabled={saveDisabled}
            startIcon={<Save size={18} />}
            sx={{ minWidth: 200 }}
          >
            {t("button.save")}
          </Button>
        </Box>
      }
    />
  );
};
