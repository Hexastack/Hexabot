/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  deepEquals,
  getUiOptions,
  type FieldProps,
  type RJSFSchema,
} from "@rjsf/utils";
import * as React from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import {
  fromJsonSchema,
  JsonSchemaObjectBuilder,
  makeDefaultSchemaNode,
  SchemaNodeForm,
  toJsonSchema,
} from "@/app-components/inputs/JsonSchemaObjectBuilder";

import { getDescription, LabelWithTooltip } from "../widgets/shared";

type JsonSchemaObjectFieldOptions = {
  maxDepth?: number;
};

type JsonSchemaObjectFieldValues = {
  schemaNode: SchemaNodeForm;
};

const toSchemaNode = (value: unknown): SchemaNodeForm => {
  return fromJsonSchema(value, "object");
};
const toNormalizedSchema = (value: unknown): RJSFSchema => {
  return toJsonSchema(toSchemaNode(value)) as RJSFSchema;
};

export const JsonSchemaObjectField = ({
  schema,
  uiSchema,
  formData,
  onChange,
  fieldPathId,
  disabled,
  readonly,
}: FieldProps<RJSFSchema>) => {
  const label = schema.title;
  const description = getDescription(schema as RJSFSchema);
  const options =
    (getUiOptions(uiSchema) as JsonSchemaObjectFieldOptions | undefined) ?? {};
  const maxDepth = options.maxDepth ?? 6;
  const readOnly = Boolean(disabled || readonly);
  const form = useForm<JsonSchemaObjectFieldValues>({
    defaultValues: {
      schemaNode: toSchemaNode(formData),
    },
  });
  const {
    control,
    reset,
    formState: { isDirty },
  } = form;
  const schemaNode = useWatch({
    control,
    name: "schemaNode",
  });
  const externalSchema = React.useMemo(
    () => toNormalizedSchema(formData),
    [formData],
  );
  const localSchema = React.useMemo(
    () =>
      toJsonSchema(schemaNode ?? makeDefaultSchemaNode("object")) as RJSFSchema,
    [schemaNode],
  );
  const lastExternalSchemaRef = React.useRef(externalSchema);
  const lastEmittedSchemaRef = React.useRef<RJSFSchema | null>(null);

  React.useEffect(() => {
    if (deepEquals(externalSchema, lastExternalSchemaRef.current)) {
      return;
    }

    lastExternalSchemaRef.current = externalSchema;
    if (
      lastEmittedSchemaRef.current &&
      deepEquals(lastEmittedSchemaRef.current, externalSchema)
    ) {
      return;
    }
    if (isDirty && !deepEquals(localSchema, externalSchema)) {
      return;
    }

    if (!deepEquals(localSchema, externalSchema)) {
      reset({ schemaNode: toSchemaNode(externalSchema) });
    }
  }, [externalSchema, isDirty, localSchema, reset]);

  React.useEffect(() => {
    if (!isDirty) {
      return;
    }

    if (deepEquals(localSchema, externalSchema)) {
      lastEmittedSchemaRef.current = null;

      return;
    }

    if (
      lastEmittedSchemaRef.current &&
      deepEquals(lastEmittedSchemaRef.current, localSchema)
    ) {
      return;
    }

    lastEmittedSchemaRef.current = localSchema;
    onChange(localSchema, fieldPathId.path);
  }, [externalSchema, fieldPathId.path, isDirty, localSchema, onChange]);

  return (
    <FormProvider {...form}>
      <JsonSchemaObjectBuilder
        name="schemaNode"
        label={<LabelWithTooltip label={label} description={description} />}
        maxDepth={maxDepth}
        readOnly={readOnly}
      />
    </FormProvider>
  );
};
