/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Paper, Stack, Typography } from "@mui/material";
import { Form } from "@rjsf/mui";
import type { RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";

import { FORM_FIELDS } from "@/components/visual-editor/v4/components/main/ActionDrawer/fields";
import { FORM_TEMPLATES } from "@/components/visual-editor/v4/components/main/ActionDrawer/templates";
import { FORM_WIDGETS } from "@/components/visual-editor/v4/components/main/ActionDrawer/widgets";
import { extractUiSchema } from "@/components/visual-editor/v4/utils/schema-defaults.utils";
import { useTranslate } from "@/hooks/useTranslate";
import type { IWorkflow } from "@/types/workfow.types";
import { WorkflowType } from "@/types/workfow.types";

const formUiSchema = {
  "ui:submitButtonOptions": {
    norender: true,
  },
} as const;

type TriggerSimulatorPanelProps = {
  workflow?: IWorkflow;
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
          <Form
            schema={inputSchema}
            validator={validator}
            formData={formData}
            formContext={{ formData }}
            onChange={(event) =>
              onFormDataChange(
                (event.formData ?? {}) as Record<string, unknown>,
              )
            }
            showErrorList={false}
            noHtml5Validate
            liveValidate
            uiSchema={{ ...formUiSchema, ...extractUiSchema(inputSchema) }}
            idPrefix="workflow-trigger"
            templates={FORM_TEMPLATES}
            fields={FORM_FIELDS}
            widgets={FORM_WIDGETS}
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
