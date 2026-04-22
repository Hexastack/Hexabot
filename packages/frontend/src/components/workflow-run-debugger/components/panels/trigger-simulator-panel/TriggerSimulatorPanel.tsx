/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowType } from "@hexabot-ai/types";
import type { Workflow } from "@hexabot-ai/types";
import { Paper, Stack, Typography } from "@mui/material";
import type { RJSFSchema } from "@rjsf/utils";

import { JsonSchemaForm } from "@/app-components/inputs/JsonSchemaForm";
import { extractUiSchema } from "@/components/visual-editor/v4/utils/schema-defaults.utils";
import { useTranslate } from "@/hooks/useTranslate";

type TriggerSimulatorPanelProps = {
  workflow?: Workflow;
  formData: Record<string, unknown>;
  onFormDataChange: (data: Record<string, unknown>) => void;
};

export const TriggerSimulatorPanel = ({
  workflow,
  formData,
  onFormDataChange,
}: TriggerSimulatorPanelProps) => {
  const { t } = useTranslate();
  const workflowType = workflow?.type;
  const inputSchema =
    workflowType === WorkflowType.manual
      ? (workflow?.inputSchema as RJSFSchema | undefined)
      : undefined;

  return (
    <Paper variant="spaced">
      <Typography variant="subtitle2" fontWeight={600}>
        {t("label.trigger_simulator")}
      </Typography>
      {workflowType === WorkflowType.manual ? (
        inputSchema ? (
          <JsonSchemaForm
            schema={inputSchema}
            formData={formData}
            onFormDataChange={onFormDataChange}
            liveValidate
            uiSchema={extractUiSchema(inputSchema)}
            idPrefix="workflow-trigger"
            enableJsonataTextWidget={false}
          />
        ) : (
          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              {t("message.workflow_input_schema_not_defined")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("message.workflow_empty_input_payload")}
            </Typography>
          </Stack>
        )
      ) : workflowType === WorkflowType.scheduled ? (
        <Typography variant="body2" color="text.secondary">
          {t("message.workflow_scheduled_run_now_hint")}
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t("message.workflow_trigger_simulator_availability")}
        </Typography>
      )}
    </Paper>
  );
};
