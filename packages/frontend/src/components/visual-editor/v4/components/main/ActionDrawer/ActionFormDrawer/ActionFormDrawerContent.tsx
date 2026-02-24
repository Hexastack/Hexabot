/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Stack, Typography } from "@mui/material";
import type { RJSFSchema } from "@rjsf/utils";

import { useTranslate } from "@/hooks/useTranslate";
import { IAction } from "@/types/action.types";

import { extractUiSchema } from "../../../../utils/schema-defaults.utils";
import { buildSettingsUiSchema } from "../../../../utils/settings-ui-schema.utils";
import { ActionSchemaPanel } from "../ActionSchemaPanel";

export type ActionFormDrawerContentProps = {
  isOpen: boolean;
  actionSchema?: IAction;
  inputData: Record<string, unknown>;
  settingsData: Record<string, unknown>;
  panelKeyBase: string;
  emptyStateLabel: string;
  onInputDataChange: (data: Record<string, unknown>) => void;
  onSettingsDataChange: (data: Record<string, unknown>) => void;
  onInputVisibleErrorsChange: (hasVisibleErrors: boolean) => void;
  onSettingsVisibleErrorsChange: (hasVisibleErrors: boolean) => void;
};

export const ActionFormDrawerContent = ({
  isOpen,
  actionSchema,
  inputData,
  settingsData,
  panelKeyBase,
  emptyStateLabel,
  onInputDataChange,
  onSettingsDataChange,
  onInputVisibleErrorsChange,
  onSettingsVisibleErrorsChange,
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
          onVisibleErrorsChange={onInputVisibleErrorsChange}
          panelKey={`${panelKeyBase}-input`}
          emptyLabel={t("visual_editor.actions_drawer.form.empty_schema.input")}
          uiSchema={extractUiSchema(actionSchema.inputSchema as RJSFSchema)}
        />
      ) : null}
      {actionSchema.settingSchema ? (
        <ActionSchemaPanel
          title={t("visual_editor.actions_drawer.form.section.settings")}
          schema={actionSchema.settingSchema}
          formData={settingsData}
          onFormDataChange={onSettingsDataChange}
          onVisibleErrorsChange={onSettingsVisibleErrorsChange}
          panelKey={`${panelKeyBase}-settings`}
          emptyLabel={t(
            "visual_editor.actions_drawer.form.empty_schema.settings",
          )}
          uiSchema={buildSettingsUiSchema(
            actionSchema.settingSchema as RJSFSchema | undefined,
            false,
            settingsData,
          )}
        />
      ) : null}
    </Stack>
  );
};
