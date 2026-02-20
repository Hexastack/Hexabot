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
import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import { ChevronDown } from "lucide-react";

import { JsonSchemaForm } from "@/app-components/inputs/JsonSchemaForm";

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
        <JsonSchemaForm
          schema={schema as RJSFSchema}
          formData={formData}
          onFormDataChange={onFormDataChange}
          uiSchema={uiSchema}
          idPrefix={`action-${panelKey}`}
        />
      ) : (
        <Typography variant="body2" color="text.secondary">
          {emptyLabel}
        </Typography>
      )}
    </AccordionDetails>
  </Accordion>
);
