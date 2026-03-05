/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  createErrorHandler,
  toErrorSchema,
  unwrapErrorHandler,
  validationDataMerge,
  type RJSFSchema,
  type RJSFValidationError,
  type ValidatorType,
} from "@rjsf/utils";
import { z } from "zod";

type ErrorPathSegment = number | string | symbol;
type ErrorPath = ErrorPathSegment[];
type JsonRecord = Record<string, unknown>;
type ZodIssueLike = {
  code?: string;
  format?: string;
  message?: string;
  path?: ErrorPath;
};
type ZodSchemaLike = {
  safeParse: (
    data: unknown,
  ) =>
    | { success: true; data: unknown }
    | { success: false; error: { issues: ZodIssueLike[] } };
};

let schemaCache = new WeakMap<object, ZodSchemaLike>();

const isRecord = (value: unknown): value is JsonRecord => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};
const mergeSchemaWithRootRefs = (
  schema: RJSFSchema,
  rootSchema: RJSFSchema,
): JsonRecord => {
  if (!isRecord(schema)) {
    throw new Error("RJSF schema must be an object.");
  }

  if (!isRecord(rootSchema) || schema === rootSchema) {
    return schema as JsonRecord;
  }

  const rootDefs = isRecord(rootSchema.$defs) ? rootSchema.$defs : undefined;
  const rootDefinitions = isRecord((rootSchema as JsonRecord).definitions)
    ? ((rootSchema as JsonRecord).definitions as JsonRecord)
    : undefined;
  const hasRootRefs = Boolean(rootDefs || rootDefinitions);

  if (!hasRootRefs) {
    return schema as JsonRecord;
  }

  const nextSchema: JsonRecord = { ...(schema as JsonRecord) };

  if (rootDefs) {
    nextSchema.$defs = {
      ...rootDefs,
      ...(isRecord(schema.$defs) ? schema.$defs : {}),
    };
  }

  if (rootDefinitions) {
    nextSchema.definitions = {
      ...rootDefinitions,
      ...(isRecord((schema as JsonRecord).definitions)
        ? ((schema as JsonRecord).definitions as JsonRecord)
        : {}),
    };
  }

  return nextSchema;
};
const getZodSchema = (
  schema: RJSFSchema,
  rootSchema: RJSFSchema,
): ZodSchemaLike => {
  if (!isRecord(schema)) {
    throw new Error("RJSF schema must be an object.");
  }

  const cachedSchema = schemaCache.get(schema as object);

  if (cachedSchema) {
    return cachedSchema;
  }

  const nextSchema = z.fromJSONSchema(
    mergeSchemaWithRootRefs(schema, rootSchema),
  ) as ZodSchemaLike;

  schemaCache.set(schema as object, nextSchema);

  return nextSchema;
};
const getValueAtPath = (data: unknown, path: ErrorPath): unknown => {
  let current: unknown = data;

  for (const segment of path) {
    if (typeof segment === "number") {
      if (!Array.isArray(current)) {
        return undefined;
      }

      current = current[segment];
      continue;
    }

    if (!isRecord(current)) {
      return undefined;
    }

    current = current[String(segment)];
  }

  return current;
};
const shouldSkipZodIssue = (
  issue: ZodIssueLike,
  formData: unknown,
): boolean => {
  if (issue.code !== "invalid_format" || issue.format !== "url") {
    return false;
  }

  const valueAtPath = getValueAtPath(formData, issue.path ?? []);

  return typeof valueAtPath === "string" && valueAtPath.startsWith("=");
};
const escapePathKey = (key: string): string => {
  return key.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
};
const toErrorPropertyPath = (path: ErrorPath): string => {
  if (path.length === 0) {
    return ".";
  }

  return path.reduce<string>((acc, segment) => {
    if (typeof segment === "number") {
      return `${acc}[${segment}]`;
    }

    const key = String(segment);

    if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)) {
      return `${acc}.${key}`;
    }

    return `${acc}['${escapePathKey(key)}']`;
  }, "");
};
const toRjsfValidationError = (issue: ZodIssueLike): RJSFValidationError => {
  const property = toErrorPropertyPath((issue.path ?? []) as ErrorPath);
  const message = issue.message || "Invalid value";
  const stack = property === "." ? message : `${property} ${message}`;

  return {
    name: issue.code ?? "validation",
    message,
    params: issue,
    property,
    stack,
  };
};
const runValidation = (
  schema: RJSFSchema,
  formData: unknown,
  rootSchema: RJSFSchema,
): { errors: RJSFValidationError[]; validationError?: Error } => {
  try {
    const zodSchema = getZodSchema(schema, rootSchema);
    const validationResult = zodSchema.safeParse(formData);

    if (validationResult.success) {
      return { errors: [] };
    }

    return {
      errors: validationResult.error.issues
        .filter((issue) => !shouldSkipZodIssue(issue, formData))
        .map(toRjsfValidationError),
    };
  } catch (error) {
    return {
      errors: [],
      validationError:
        error instanceof Error
          ? error
          : new Error("Failed to run zod validation."),
    };
  }
};
const zodValidator: ValidatorType = {
  validateFormData(
    formData,
    schema,
    customValidate,
    transformErrors,
    uiSchema,
  ) {
    const { errors: parsedErrors, validationError } = runValidation(
      schema,
      formData,
      schema,
    );
    const fallbackValidationError = validationError
      ? [
          {
            name: "validation",
            message: validationError.message,
            property: ".",
            stack: validationError.message,
          } satisfies RJSFValidationError,
        ]
      : [];
    let errors = parsedErrors.concat(fallbackValidationError);

    if (transformErrors) {
      errors = transformErrors(errors, uiSchema);
    }

    let validationData = {
      errors,
      errorSchema: toErrorSchema(errors),
    };

    if (!customValidate) {
      return validationData;
    }

    const userErrorSchema = unwrapErrorHandler(
      customValidate(formData, createErrorHandler(formData), uiSchema),
    );

    validationData = validationDataMerge(validationData, userErrorSchema, true);

    return validationData;
  },
  isValid(schema, formData, rootSchema) {
    const { errors, validationError } = runValidation(
      schema,
      formData,
      rootSchema,
    );

    return !validationError && errors.length === 0;
  },
  rawValidation<Result = any>(schema, formData) {
    const { errors, validationError } = runValidation(schema, formData, schema);

    return {
      errors: errors as unknown as Result[],
      validationError,
    };
  },
  reset() {
    schemaCache = new WeakMap();
  },
};

export default zodValidator;
