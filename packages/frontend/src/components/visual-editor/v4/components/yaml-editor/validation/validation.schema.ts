/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Monaco } from "@monaco-editor/react";
import { Validator, type Schema, type ValidationError } from "jsonschema";
import type { editor } from "monaco-editor";
import type { LineCounter, parseDocument } from "yaml";

import type { ReferencePath } from "./validation.paths";
// eslint-disable-next-line no-duplicate-imports
import { getRangeForPath } from "./validation.paths";

type JsonSchemaValue = Schema | boolean;
type YamlDocument = ReturnType<typeof parseDocument>;

// Reuse a single validator instance to avoid repeated allocations.
const schemaValidator = new Validator();
const isExpressionString = (value: unknown) =>
  typeof value === "string" && value.startsWith("=");

export const isSchemaLike = (schema: object): schema is Schema =>
  Boolean(schema) &&
  typeof schema === "object" &&
  ("$ref" in schema ||
    "type" in schema ||
    "properties" in schema ||
    "definitions" in schema ||
    "$schema" in schema ||
    "allOf" in schema ||
    "anyOf" in schema ||
    "oneOf" in schema);

// Decode JSON pointer segments with support for RFC6901 escaping.
const decodePointerSegment = (segment: string) => {
  let value = segment;

  try {
    value = decodeURIComponent(segment);
  } catch {
    value = segment;
  }

  return value.replace(/~1/g, "/").replace(/~0/g, "~");
};
// Resolve a JSON pointer against a schema node with array and object support.
const resolveJsonPointer = (
  root: JsonSchemaValue,
  pointer: string,
): JsonSchemaValue | null => {
  if (!pointer.startsWith("#")) {
    return null;
  }

  if (pointer === "#") {
    return root;
  }

  const parts = pointer
    .slice(1)
    .split("/")
    .filter((segment) => segment.length > 0)
    .map(decodePointerSegment);

  let current: unknown = root;

  for (const part of parts) {
    if (current === null || typeof current !== "object") {
      return null;
    }

    if (Array.isArray(current)) {
      const index = Number(part);

      if (!Number.isInteger(index)) {
        return null;
      }

      current = current[index];
      continue;
    }

    const record = current as Record<string, unknown>;

    if (!(part in record)) {
      return null;
    }

    current = record[part];
  }

  return (current as JsonSchemaValue) ?? null;
};
// Inline local $ref pointers so jsonschema validation can inspect the full shape.
const inlineSchemaRefs = (schema: Schema): JsonSchemaValue => {
  const cache = new Map<string, JsonSchemaValue>();
  const visiting = new Set<string>();
  const resolveNode = (node: JsonSchemaValue, root: JsonSchemaValue) => {
    if (node === null || typeof node !== "object") {
      return node;
    }

    if (Array.isArray(node)) {
      return node.map((item) => resolveNode(item, root)) as JsonSchemaValue;
    }

    const record = node as Record<string, unknown>;
    const ref = typeof record.$ref === "string" ? record.$ref : null;

    if (ref) {
      if (cache.has(ref)) {
        return cache.get(ref) as JsonSchemaValue;
      }

      if (visiting.has(ref)) {
        return {};
      }

      const resolved = resolveJsonPointer(root, ref);

      if (!resolved) {
        return {};
      }

      visiting.add(ref);
      const nextResolved = resolveNode(resolved, root);

      visiting.delete(ref);
      cache.set(ref, nextResolved);

      return nextResolved;
    }

    return Object.fromEntries(
      Object.entries(record)
        .filter(([key]) => key !== "$ref")
        .map(([key, value]) => [
          key,
          resolveNode(value as JsonSchemaValue, root),
        ]),
    ) as JsonSchemaValue;
  };

  return resolveNode(schema, schema);
};
const getSchemaErrorPath = (error: ValidationError): ReferencePath => {
  if (error.path.length > 0) {
    return error.path;
  }

  if (typeof error.argument === "string") {
    return [error.argument];
  }

  return [];
};
const formatSchemaErrorMessage = (section: string, error: ValidationError) => {
  const pathSuffix = error.path.length > 0 ? `.${error.path.join(".")}` : "";

  return `${section}${pathSuffix}: ${error.message}`;
};

export const appendSchemaMarkers = ({
  section,
  schema,
  instance,
  basePath,
  doc,
  lineCounter,
  markers,
  monacoInstance,
  ignoreRequired,
}: {
  section: string;
  schema: Schema;
  instance: unknown;
  basePath: ReferencePath;
  doc: YamlDocument;
  lineCounter: LineCounter;
  markers: editor.IMarkerData[];
  monacoInstance: Monaco;
  ignoreRequired?: boolean;
}) => {
  const normalizedSchema = inlineSchemaRefs(schema);
  let result;

  try {
    result = schemaValidator.validate(instance, normalizedSchema as Schema, {
      nestedErrors: true,
    });
  } catch {
    return;
  }

  result.errors.forEach((error) => {
    if (ignoreRequired && error.name === "required") {
      return;
    }

    // Expression strings are evaluated at runtime, so skip validation errors.
    if (isExpressionString(error.instance)) {
      return;
    }

    const path = getSchemaErrorPath(error);

    markers.push({
      ...getRangeForPath(doc, [...basePath, ...path], lineCounter),
      message: formatSchemaErrorMessage(section, error),
      severity: monacoInstance.MarkerSeverity.Error,
    });
  });
};
