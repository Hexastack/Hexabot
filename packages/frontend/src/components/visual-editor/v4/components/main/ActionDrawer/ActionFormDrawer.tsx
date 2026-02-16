/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { JsonValue, TaskDefinition } from "@hexabot-ai/agentic";
import { Box, Button, Stack, Typography } from "@mui/material";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import { useReactFlow } from "@xyflow/react";
import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { withDrawerLayout } from "@/app-components/drawers/DrawerLayout";
import { useWorkflowActionsCatalog } from "@/contexts/workflow-actions.context";
import { useTranslate } from "@/hooks/useTranslate";
import { IAction } from "@/types/action.types";

import { useWorkflow } from "../../../hooks/useWorkflow";
import { ENodeType, type GraphNode } from "../../../types/workflow-node.types";
import { humanizeTaskName } from "../../../utils/graph.utils";

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
  if (!schema || typeof schema !== "object") {
    return undefined;
  }

  const properties =
    schema.properties && typeof schema.properties === "object"
      ? Object.keys(schema.properties)
      : [];

  if (properties.length === 0) {
    return undefined;
  }

  const commonSet = new Set<string>(COMMON_SETTING_KEYS);
  const actionSpecific = properties.filter((key) => !commonSet.has(key));
  const commonOrdered = COMMON_SETTING_KEYS.filter((key) =>
    properties.includes(key),
  );
  const uiSchema: UiSchema = {
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
  const settingsUiSchema = useMemo(
    () =>
      buildSettingsUiSchema(
        actionSchema?.settingSchema as RJSFSchema | undefined,
      ),
    [actionSchema?.settingSchema],
  );

  if (!isOpen) return null;

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
          uiSchema={settingsUiSchema}
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
  const actionName = isActionNode
    ? selectedNode?.type === ENodeType.TASK
      ? (selectedNode?.data as { actionName?: string })?.actionName
      : (selectedNode?.data as { action?: string })?.action
    : undefined;
  const taskName = isActionNode
    ? (selectedNode?.data as { title?: string })?.title
    : undefined;
  const actionSchema = actionName ? actionsByName.get(actionName) : undefined;
  const taskDefinition = taskName ? definition?.tasks?.[taskName] : undefined;
  const [inputData, setInputData] = useState<Record<string, unknown>>({});
  const [settingsData, setSettingsData] = useState<Record<string, unknown>>({});
  const open = Boolean(isActionNode && selectedNodeId);
  const panelKeyBase = selectedNodeId ?? actionName ?? "action";
  const emptyStateLabel = actionName
    ? t("visual_editor.actions_drawer.form.empty_state.no_schema")
    : t("visual_editor.actions_drawer.form.empty_state.no_action");

  useEffect(() => {
    setInputData((taskDefinition?.inputs as Record<string, unknown>) ?? {});
    setSettingsData(
      (taskDefinition?.settings as Record<string, unknown>) ?? {},
    );
  }, [taskDefinition, actionName]);

  const handleClose = () => {
    if (selectedFlowId) {
      updateWorkflowURL(selectedFlowId);
    }
  };
  const handleSave = () => {
    if (!definition || !taskName) {
      return;
    }

    const currentTask = definition.tasks?.[taskName];

    if (!currentTask) {
      return;
    }

    const hasInputValues = Object.keys(inputData).length > 0;
    const hasSettingValues = Object.keys(settingsData).length > 0;
    const shouldIncludeInputs =
      hasInputValues || currentTask.inputs !== undefined;
    const shouldIncludeSettings =
      hasSettingValues || currentTask.settings !== undefined;
    const nextTask: TaskDefinition = {
      ...currentTask,
      ...(shouldIncludeInputs
        ? { inputs: inputData as Record<string, JsonValue> }
        : {}),
      ...(shouldIncludeSettings
        ? { settings: settingsData as TaskDefinition["settings"] }
        : {}),
    };

    updateDefinitionState({
      ...definition,
      tasks: {
        ...(definition.tasks ?? {}),
        [taskName]: nextTask,
      },
    });
    handleClose();
  };
  const actionLabel =
    actionName ?? t("visual_editor.actions_drawer.form.action_label.none");
  const headerContent = (
    <Box minWidth={0}>
      <Typography variant="subtitle1" noWrap>
        {taskName ? humanizeTaskName(taskName) : actionLabel}&nbsp;
        <Typography variant="caption" color="text.secondary" noWrap>
          ({actionLabel})
        </Typography>
      </Typography>

      {actionSchema?.description ? (
        <Typography variant="body2" color="text.secondary">
          {actionSchema.description}
        </Typography>
      ) : null}
    </Box>
  );
  const saveLabel = t("button.save");
  const saveDisabled =
    !definition || !taskName || !isActionNode || !taskDefinition || isSaving;

  return (
    <ActionFormDrawerLayout
      isOpen={open}
      actionSchema={actionSchema}
      inputData={inputData}
      settingsData={settingsData}
      panelKeyBase={panelKeyBase}
      emptyStateLabel={emptyStateLabel}
      onInputDataChange={setInputData}
      onSettingsDataChange={setSettingsData}
      open={open}
      onClose={handleClose}
      headerContent={headerContent}
      footerContent={
        <Box display="flex" justifyContent="center">
          <Button
            variant="contained"
            size="large"
            onClick={handleSave}
            disabled={saveDisabled}
            aria-label={saveLabel}
            startIcon={<Save size={18} />}
            sx={{ minWidth: 200 }}
          >
            {saveLabel}
          </Button>
        </Box>
      }
    />
  );
};
