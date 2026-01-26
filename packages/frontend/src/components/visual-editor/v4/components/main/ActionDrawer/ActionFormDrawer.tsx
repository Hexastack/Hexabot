/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Stack, Typography } from "@mui/material";
import { useReactFlow } from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";

import { withDrawerLayout } from "@/app-components/drawers/DrawerLayout";
import { useTranslate } from "@/hooks/useTranslate";
import { IAction } from "@/types/action.types";

import { useWorkflow } from "../../../hooks/useWorkflow";
import { ENodeType, type NodeData } from "../../../types/workflow-node.types";
import { humanizeTaskName } from "../../../utils/graph.utils";

import { ActionSchemaPanel } from "./ActionSchemaPanel";

type ActionFormDrawerContentProps = {
  isOpen: boolean;
  actionSchema?: IAction;
  inputData: Record<string, unknown>;
  settingsData: Record<string, unknown>;
  outputData: Record<string, unknown>;
  panelKeyBase: string;
  emptyStateLabel: string;
  onInputDataChange: (data: Record<string, unknown>) => void;
  onSettingsDataChange: (data: Record<string, unknown>) => void;
  onOutputDataChange: (data: Record<string, unknown>) => void;
};

const ActionFormDrawerContent = ({
  isOpen,
  actionSchema,
  inputData,
  settingsData,
  outputData,
  panelKeyBase,
  emptyStateLabel,
  onInputDataChange,
  onSettingsDataChange,
  onOutputDataChange,
}: ActionFormDrawerContentProps) => {
  const { t } = useTranslate();

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
        />
      ) : null}
      {actionSchema.outputSchema ? (
        <ActionSchemaPanel
          title={t("visual_editor.actions_drawer.form.section.output")}
          schema={actionSchema.outputSchema}
          formData={outputData}
          onFormDataChange={onOutputDataChange}
          panelKey={`${panelKeyBase}-output`}
          emptyLabel={t(
            "visual_editor.actions_drawer.form.empty_schema.output",
          )}
        />
      ) : null}
    </Stack>
  );
};
const ActionFormDrawerLayout = withDrawerLayout(ActionFormDrawerContent);

export const ActionFormDrawer = () => {
  const { t } = useTranslate();
  const { selectedNodeIds, selectedFlowId, updateWorkflowURL, actions, definition } = useWorkflow();
  const { getNode } = useReactFlow();
  const selectedNodeId =
    selectedNodeIds.length === 1 ? selectedNodeIds[0] : undefined;
  const selectedNode = selectedNodeId
    ? (getNode(selectedNodeId) as NodeData | undefined)
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
  const actionsByName = useMemo(() => {
    const map = new Map<string, IAction>();

    actions.forEach((action) => {
      map.set(action.name, action);
    });

    return map;
  }, [actions]);
  const actionSchema = actionName ? actionsByName.get(actionName) : undefined;
  const taskDefinition = taskName ? definition?.tasks?.[taskName] : undefined;
  const [inputData, setInputData] = useState<Record<string, unknown>>({});
  const [settingsData, setSettingsData] = useState<Record<string, unknown>>({});
  const [outputData, setOutputData] = useState<Record<string, unknown>>({});
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
    setOutputData((taskDefinition?.outputs as Record<string, unknown>) ?? {});
  }, [taskDefinition, actionName]);

  const handleClose = () => {
    if (selectedFlowId) {
      updateWorkflowURL(selectedFlowId);
    }
  };
  const nodeLabel =
    selectedNode?.type === ENodeType.AGENT
      ? t("visual_editor.actions_drawer.form.node_label.agent")
      : t("visual_editor.actions_drawer.form.node_label.task");
  const title = taskName ? humanizeTaskName(taskName) : nodeLabel;
  const actionLabel =
    actionName ?? t("visual_editor.actions_drawer.form.action_label.none");
  const headerContent = (
    <Box minWidth={0}>
      <Typography variant="overline" color="text.secondary">
        {nodeLabel}
      </Typography>
      <Typography variant="subtitle1" noWrap>
        {title}&nbsp;
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

  return (
    <ActionFormDrawerLayout
      isOpen={open}
      actionSchema={actionSchema}
      inputData={inputData}
      settingsData={settingsData}
      outputData={outputData}
      panelKeyBase={panelKeyBase}
      emptyStateLabel={emptyStateLabel}
      onInputDataChange={setInputData}
      onSettingsDataChange={setSettingsData}
      onOutputDataChange={setOutputData}
      open={open}
      onClose={handleClose}
      headerContent={headerContent}
    />
  );
};
