/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from "@mui/material";
import { Form } from "@rjsf/mui";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import { ChevronDown } from "lucide-react";

import { FORM_FIELDS } from "./fields";
import { FORM_TEMPLATES } from "./templates";
import { FORM_WIDGETS } from "./widgets";

const formUiSchema = {
  "ui:submitButtonOptions": {
    norender: true,
  },
} as const;

export type ActionSchemaPanelProps = {
  title: string;
  schema?: unknown;
  formData: Record<string, unknown>;
  onFormDataChange: (data: Record<string, unknown>) => void;
  panelKey: string;
  emptyLabel: string;
  uiSchema?: UiSchema;
};

export const ActionSchemaPanel = ({
  title,
  schema,
  formData,
  onFormDataChange,
  panelKey,
  emptyLabel,
  uiSchema,
}: ActionSchemaPanelProps) => (
  <Accordion variant="elevation" defaultExpanded>
    <AccordionSummary expandIcon={<ChevronDown size={16} />}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
    </AccordionSummary>
    <AccordionDetails>
      {schema ? (
        <Form
          schema={schema as RJSFSchema}
          validator={validator}
          formData={formData}
          formContext={{ formData }}
          onChange={(event) =>
            onFormDataChange((event.formData ?? {}) as Record<string, unknown>)
          }
          showErrorList={false}
          noHtml5Validate
          uiSchema={{ ...formUiSchema, ...(uiSchema ?? {}) }}
          idPrefix={`action-${panelKey}`}
          templates={FORM_TEMPLATES}
          fields={FORM_FIELDS}
          widgets={FORM_WIDGETS}
        />
      ) : (
        <Typography variant="body2" color="text.secondary">
          {emptyLabel}
        </Typography>
      )}
    </AccordionDetails>
  </Accordion>
);
