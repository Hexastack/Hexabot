/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type RJSFForm from "@rjsf/core";
import { Form } from "@rjsf/mui";
import {
  getDefaultFormState,
  type RJSFSchema,
  type UiSchema,
} from "@rjsf/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { isRecord } from "@/utils/object";
import validator from "@/utils/rjsf-zod-validator";

import { FORM_FIELDS } from "./fields";
import { FORM_TEMPLATES } from "./templates";
import { getFormWidgets } from "./widgets";

const FORM_UI_SCHEMA = {
  "ui:submitButtonOptions": {
    norender: true,
  },
} as const;
const withSchemaDefaults = (
  schema: RJSFSchema,
  formData: Record<string, unknown>,
) => {
  try {
    const nextFormData = getDefaultFormState<Record<string, unknown>>(
      validator,
      schema,
      formData,
      schema,
      false,
      {
        emptyObjectFields: "skipEmptyDefaults",
      },
    );

    return isRecord(nextFormData) ? nextFormData : formData;
  } catch {
    return formData;
  }
};

type JsonSchemaFormProps<
  D extends Record<string, unknown> = Record<string, unknown>,
> = {
  schema: RJSFSchema;
  formData: Record<string, unknown>;
  onFormDataChange: (data: D, errors?: unknown[]) => void;
  idPrefix?: string;
  uiSchema?: UiSchema;
  liveValidate?: "onChange" | "onBlur" | boolean;
  enableJsonataTextWidget?: boolean;
  formContext?: Record<string, unknown>;
  onVisibleErrorsChange?: (hasVisibleErrors: boolean) => void;
  validateOnMount?: boolean;
};

export const JsonSchemaForm = <
  D extends Record<string, unknown> = Record<string, unknown>,
>({
  schema,
  formData,
  onFormDataChange,
  idPrefix,
  uiSchema,
  liveValidate = "onChange",
  enableJsonataTextWidget = true,
  formContext,
  onVisibleErrorsChange,
  validateOnMount = false,
}: JsonSchemaFormProps<D>) => {
  const formRef = useRef<RJSFForm<Record<string, unknown>, RJSFSchema> | null>(
    null,
  );
  const visibleErrorFieldIdsRef = useRef<Set<string>>(new Set());
  const [hasVisibleErrors, setHasVisibleErrors] = useState(false);
  const normalizedFormData = useMemo(
    () => withSchemaDefaults(schema, formData),
    [formData, schema],
  );
  const [liveFormData, setLiveFormData] =
    useState<Record<string, unknown>>(normalizedFormData);
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
    setLiveFormData(normalizedFormData);
  }, [normalizedFormData]);

  useEffect(() => {
    onVisibleErrorsChange?.(hasVisibleErrors);
  }, [hasVisibleErrors, onVisibleErrorsChange]);

  useEffect(() => {
    if (!validateOnMount) {
      return;
    }

    formRef.current?.validateForm();
  }, [validateOnMount, schema, idPrefix]);

  useEffect(() => {
    return () => {
      onVisibleErrorsChange?.(false);
    };
  }, [onVisibleErrorsChange]);

  return (
    <Form
      ref={formRef}
      schema={schema}
      validator={validator}
      formData={liveFormData}
      formContext={{
        ...(formContext ?? {}),
        formData: liveFormData,
        reportFieldVisibleError,
      }}
      onChange={(event) => {
        const nextFormData = event.formData ?? {};

        setLiveFormData(nextFormData);
        onFormDataChange(nextFormData, event.errors);
      }}
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
