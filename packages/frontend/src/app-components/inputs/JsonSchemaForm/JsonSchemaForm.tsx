/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Form } from "@rjsf/mui";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import { useCallback, useEffect, useRef, useState } from "react";

import validator from "@/utils/rjsf-zod-validator";

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
  liveValidate?: "onChange" | "onBlur" | boolean;
  enableJsonataTextWidget?: boolean;
  formContext?: Record<string, unknown>;
  onVisibleErrorsChange?: (hasVisibleErrors: boolean) => void;
};

export const JsonSchemaForm = ({
  schema,
  formData,
  onFormDataChange,
  idPrefix,
  uiSchema,
  liveValidate = "onChange",
  enableJsonataTextWidget = true,
  formContext,
  onVisibleErrorsChange,
}: JsonSchemaFormProps) => {
  const visibleErrorFieldIdsRef = useRef<Set<string>>(new Set());
  const [hasVisibleErrors, setHasVisibleErrors] = useState(false);
  const reportFieldVisibleError = useCallback(
    (fieldId: string, hasVisibleError: boolean) => {
      if (!fieldId) {
        return;
      }

      const next = visibleErrorFieldIdsRef.current;

      if (hasVisibleError) {
        next.add(fieldId);
      } else {
        next.delete(fieldId);
      }

      const nextHasVisibleErrors = next.size > 0;

      setHasVisibleErrors((previous) =>
        previous === nextHasVisibleErrors ? previous : nextHasVisibleErrors,
      );
    },
    [],
  );

  useEffect(() => {
    onVisibleErrorsChange?.(hasVisibleErrors);
  }, [hasVisibleErrors, onVisibleErrorsChange]);

  useEffect(() => {
    return () => {
      onVisibleErrorsChange?.(false);
    };
  }, [onVisibleErrorsChange]);

  return (
    <Form
      schema={schema}
      validator={validator}
      formData={formData}
      formContext={{
        ...(formContext ?? {}),
        formData,
        reportFieldVisibleError,
      }}
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
