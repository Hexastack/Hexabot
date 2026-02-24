/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  BaseSettingsSchema,
  type JsonValue,
  type Settings,
} from "@hexabot-ai/agentic";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  type DialogProps,
  Typography,
} from "@mui/material";
import type { RJSFSchema } from "@rjsf/utils";
import type { JSONSchema } from "monaco-yaml";
import { useEffect, useMemo, useState } from "react";

import { DialogTitle } from "@/app-components/dialogs";
import { JsonSchemaForm } from "@/app-components/inputs/JsonSchemaForm";
import { useTranslate } from "@/hooks/useTranslate";

import { getSchemaDefaults } from "../../../utils/schema-defaults.utils";
import {
  buildSettingsUiSchema,
  normalizeSettingsFormData,
} from "../../../utils/settings-ui-schema.utils";

type WorkflowSettingsDialogProps = {
  open: boolean;
  settings?: Settings;
  onClose: () => void;
  onSave: (settings: Settings) => void;
  saveDisabled?: boolean;
};

const WORKFLOW_SETTINGS_SCHEMA = BaseSettingsSchema.toJSONSchema({
  target: "draft-07",
}) as RJSFSchema;
const WORKFLOW_SETTING_KEYS = new Set(
  Object.keys(WORKFLOW_SETTINGS_SCHEMA.properties ?? {}),
);
const splitSettings = (settings?: Settings) => {
  const workflowSettings: Record<string, unknown> = {};
  const passthroughSettings: Record<string, JsonValue> = {};

  if (!settings || typeof settings !== "object") {
    return { workflowSettings, passthroughSettings };
  }

  for (const [key, value] of Object.entries(settings)) {
    if (WORKFLOW_SETTING_KEYS.has(key)) {
      workflowSettings[key] = value;
    } else {
      passthroughSettings[key] = value as JsonValue;
    }
  }

  return { workflowSettings, passthroughSettings };
};

export const WorkflowSettingsDialog = ({
  open,
  settings,
  onClose,
  onSave,
  saveDisabled = false,
}: WorkflowSettingsDialogProps) => {
  const { t } = useTranslate();
  const [settingsData, setSettingsData] = useState<Record<string, unknown>>({});
  const [passthroughSettings, setPassthroughSettings] = useState<
    Record<string, JsonValue>
  >({});
  const [hasVisibleErrors, setHasVisibleErrors] = useState(false);
  const defaults = useMemo(
    () =>
      getSchemaDefaults<Record<string, JsonValue>>(
        WORKFLOW_SETTINGS_SCHEMA as JSONSchema,
      ) ?? {},
    [],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const { workflowSettings, passthroughSettings: remainingSettings } =
      splitSettings(settings);

    setSettingsData(
      normalizeSettingsFormData({
        ...defaults,
        ...workflowSettings,
      }),
    );
    setPassthroughSettings(remainingSettings);
    setHasVisibleErrors(false);
  }, [defaults, open, settings]);

  const handleClose: DialogProps["onClose"] = () => {
    onClose();
  };
  const handleSave = () => {
    if (saveDisabled || hasVisibleErrors) {
      return;
    }

    onSave({
      ...passthroughSettings,
      ...(settingsData as Settings),
    });
  };

  return (
    <Dialog open={open} fullWidth maxWidth="sm" onClose={handleClose}>
      <DialogTitle onClose={onClose}>
        {t("visual_editor.workflow_title_bar.settings.title")}
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          {t("visual_editor.workflow_title_bar.settings.description")}
        </Typography>
        <JsonSchemaForm
          schema={WORKFLOW_SETTINGS_SCHEMA}
          formData={settingsData}
          onFormDataChange={setSettingsData}
          onVisibleErrorsChange={setHasVisibleErrors}
          uiSchema={buildSettingsUiSchema(
            WORKFLOW_SETTINGS_SCHEMA,
            true,
            settingsData,
          )}
          idPrefix="workflow-default-settings"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" color="error" onClick={onClose}>
          {t("button.cancel")}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saveDisabled || hasVisibleErrors}
        >
          {t("button.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
