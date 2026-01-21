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
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Form from "@rjsf/mui";
import type { RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import { ChevronDown } from "lucide-react";

import { theme } from "@/layout/themes/theme";

const compactFormTheme = createTheme(theme, {
  components: {
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
    MuiCheckbox: {
      defaultProps: {
        size: "small",
      },
    },
    MuiRadio: {
      defaultProps: {
        size: "small",
      },
    },
  },
});
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
};

export const ActionSchemaPanel = ({
  title,
  schema,
  formData,
  onFormDataChange,
  panelKey,
  emptyLabel,
}: ActionSchemaPanelProps) => (
  <Accordion variant="outlined" defaultExpanded>
    <AccordionSummary expandIcon={<ChevronDown size={16} />}>
      <Typography variant="subtitle2">{title}</Typography>
    </AccordionSummary>
    <AccordionDetails>
      {schema ? (
        <ThemeProvider theme={compactFormTheme}>
          <Form
            schema={schema as RJSFSchema}
            validator={validator}
            formData={formData}
            onChange={(event) =>
              onFormDataChange((event.formData ?? {}) as Record<string, unknown>)
            }
            showErrorList={false}
            noHtml5Validate
            uiSchema={formUiSchema}
            idPrefix={`action-${panelKey}`}
          />
        </ThemeProvider>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {emptyLabel}
        </Typography>
      )}
    </AccordionDetails>
  </Accordion>
);
