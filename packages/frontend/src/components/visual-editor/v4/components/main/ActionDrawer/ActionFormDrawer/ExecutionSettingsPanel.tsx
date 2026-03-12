/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseSettingsSchema } from "@hexabot-ai/agentic";
import { FormControlLabel, Stack, Switch } from "@mui/material";
import type { RJSFSchema } from "@rjsf/utils";

import { JsonSchemaForm } from "@/app-components/inputs/JsonSchemaForm";
import { useTranslate } from "@/hooks/useTranslate";

import { buildSettingsUiSchema } from "../../../../utils/settings-ui-schema.utils";

const EXECUTION_SETTINGS_SCHEMA = BaseSettingsSchema.toJSONSchema({
  target: "draft-07",
}) as RJSFSchema;

export type ExecutionSettingsPanelProps = {
  executionSettingsData: Record<string, unknown>;
  isUsingWorkflowExecutionDefaults: boolean;
  panelKeyBase: string;
  onExecutionSettingsDataChange: (data: Record<string, unknown>) => void;
  onExecutionSettingsModeChange: (useWorkflowDefaults: boolean) => void;
  onExecutionSettingsVisibleErrorsChange: (hasVisibleErrors: boolean) => void;
};

export const ExecutionSettingsPanel = ({
  executionSettingsData,
  isUsingWorkflowExecutionDefaults,
  panelKeyBase,
  onExecutionSettingsDataChange,
  onExecutionSettingsModeChange,
  onExecutionSettingsVisibleErrorsChange,
}: ExecutionSettingsPanelProps) => {
  const { t } = useTranslate();
  const isOverridingGlobalSettings = !isUsingWorkflowExecutionDefaults;
  const overrideExecutionUiSchema = buildSettingsUiSchema(
    EXECUTION_SETTINGS_SCHEMA,
    executionSettingsData,
  );

  return (
    <Stack spacing={1.5} p={1}>
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={isOverridingGlobalSettings}
            onChange={(_event, checked) => {
              onExecutionSettingsModeChange(!checked);
            }}
          />
        }
        label={t(
          "visual_editor.actions_drawer.form.execution_settings.mode.override_global_settings",
        )}
      />
      {isOverridingGlobalSettings ? (
        <JsonSchemaForm
          schema={EXECUTION_SETTINGS_SCHEMA}
          formData={executionSettingsData}
          onFormDataChange={onExecutionSettingsDataChange}
          onVisibleErrorsChange={onExecutionSettingsVisibleErrorsChange}
          uiSchema={overrideExecutionUiSchema}
          enableJsonataTextWidget={false}
          idPrefix={`action-${panelKeyBase}-execution-override`}
        />
      ) : null}
    </Stack>
  );
};
