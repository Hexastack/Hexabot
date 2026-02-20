/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Form } from "@rjsf/mui";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";

import { FORM_FIELDS } from "./fields";
import { FORM_TEMPLATES } from "./templates";
import { getFormWidgets } from "./widgets";

const FORM_UI_SCHEMA = {
  "ui:submitButtonOptions": {
    norender: true,
  },
} as const;

type JsonSchemaFormProps = {
  schema: RJSFSchema;
  formData: Record<string, unknown>;
  onFormDataChange: (data: Record<string, unknown>) => void;
  idPrefix?: string;
  uiSchema?: UiSchema;
  liveValidate?: boolean;
  enableJsonataTextWidget?: boolean;
  formContext?: Record<string, unknown>;
};

export const JsonSchemaForm = ({
  schema,
  formData,
  onFormDataChange,
  idPrefix,
  uiSchema,
  liveValidate = false,
  enableJsonataTextWidget = true,
  formContext,
}: JsonSchemaFormProps) => {
  return (
    <Form
      schema={schema}
      validator={validator}
      formData={formData}
      formContext={{ ...(formContext ?? {}), formData }}
      onChange={(event) =>
        onFormDataChange((event.formData ?? {}) as Record<string, unknown>)
      }
      showErrorList={false}
      noHtml5Validate
      liveValidate={liveValidate}
      uiSchema={{ ...FORM_UI_SCHEMA, ...(uiSchema ?? {}) }}
      idPrefix={idPrefix}
      templates={FORM_TEMPLATES}
      fields={FORM_FIELDS}
      widgets={getFormWidgets(enableJsonataTextWidget)}
    />
  );
};
