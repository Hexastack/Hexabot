/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  Plus as AddIcon,
  Trash2 as DeleteIcon,
  ChevronDown as ExpandMoreIcon,
} from "lucide-react";
import * as React from "react";
import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from "react-hook-form";

import { useTranslate } from "@/hooks/useTranslate";

export type JsonSchemaType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "object"
  | "array"
  | "null";

export type SchemaNodeForm =
  | {
      type: "object";
      title?: string;
      description?: string;
      additionalProperties?: boolean;
      properties: PropertyEntryForm[];
    }
  | {
      type: "array";
      title?: string;
      description?: string;
      items: SchemaNodeForm;
    }
  | {
      type: Exclude<JsonSchemaType, "object" | "array">;
      title?: string;
      description?: string;
    };

export type PropertyEntryForm = {
  key: string;
  required?: boolean;
  schema: SchemaNodeForm;
};

const TYPE_OPTIONS: { value: JsonSchemaType; label: string }[] = [
  { value: "string", label: "string" },
  { value: "number", label: "number" },
  { value: "integer", label: "integer" },
  { value: "boolean", label: "boolean" },
  { value: "object", label: "object" },
  { value: "array", label: "array" },
  { value: "null", label: "null" },
];

export function makeDefaultSchemaNode(type: JsonSchemaType): SchemaNodeForm {
  switch (type) {
    case "object":
      return {
        type: "object",
        additionalProperties: true,
        properties: [],
      };
    case "array":
      return {
        type: "array",
        items: makeDefaultSchemaNode("string"),
      };
    default:
      return { type };
  }
}

/**
 * Convert the form-friendly structure into a JSON Schema object.
 * You can wrap the root with {$schema: "..."} if you want in your submit handler.
 */
export function toJsonSchema(node: SchemaNodeForm): Record<string, any> {
  const base: Record<string, any> = { type: node.type };
  const title = (node as any).title?.trim?.();
  const description = (node as any).description?.trim?.();

  if (title) base.title = title;
  if (description) base.description = description;

  if (node.type === "object") {
    const propsObj: Record<string, any> = {};
    const required: string[] = [];

    for (const p of node.properties ?? []) {
      const key = (p.key ?? "").trim();

      if (!key) continue;

      propsObj[key] = toJsonSchema(p.schema);
      if (p.required) required.push(key);
    }

    base.properties = propsObj;
    if (required.length) base.required = required;

    // JSON Schema default is "allowed", but we keep it explicit (clearer in UIs)
    base.additionalProperties =
      typeof node.additionalProperties === "boolean"
        ? node.additionalProperties
        : true;
  }

  if (node.type === "array") {
    base.items = toJsonSchema(node.items);
  }

  return base;
}

const isPlainObject = (value: unknown): value is Record<string, any> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isJsonSchemaType = (value: unknown): value is JsonSchemaType =>
  typeof value === "string" &&
  TYPE_OPTIONS.some((option) => option.value === value);
const capitalizeFirstLetter = (value: string): string =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
const resolveSchemaType = (
  schema: Record<string, any>,
  fallbackType: JsonSchemaType,
): JsonSchemaType => {
  const rawType = schema.type;

  if (Array.isArray(rawType)) {
    const match = rawType.find((entry) => isJsonSchemaType(entry));

    if (match) return match;
  }

  if (isJsonSchemaType(rawType)) return rawType;
  if ("properties" in schema || "additionalProperties" in schema)
    return "object";
  if ("items" in schema) return "array";

  return fallbackType;
};

export function fromJsonSchema(
  input: unknown,
  fallbackType: JsonSchemaType = "object",
): SchemaNodeForm {
  const schema = isPlainObject(input) ? input : {};
  const type = resolveSchemaType(schema, fallbackType);
  const title = typeof schema.title === "string" ? schema.title : undefined;
  const description =
    typeof schema.description === "string" ? schema.description : undefined;

  if (type === "object") {
    const properties = isPlainObject(schema.properties)
      ? schema.properties
      : {};
    const required = Array.isArray(schema.required)
      ? schema.required.filter(
          (value): value is string => typeof value === "string",
        )
      : [];
    const requiredSet = new Set(required);

    return {
      type: "object",
      title,
      description,
      additionalProperties:
        typeof schema.additionalProperties === "boolean"
          ? schema.additionalProperties
          : true,
      properties: Object.entries(properties).map(([key, value]) => ({
        key,
        required: requiredSet.has(key),
        schema: fromJsonSchema(value, "string"),
      })),
    };
  }

  if (type === "array") {
    return {
      type: "array",
      title,
      description,
      items: schema.items
        ? fromJsonSchema(schema.items, "string")
        : makeDefaultSchemaNode("string"),
    };
  }

  return { type, title, description };
}

type SchemaNodeEditorProps = {
  /** react-hook-form path to this schema node (e.g. "schema", "schema.items", "schema.properties.0.schema") */
  name: string;
  label?: string;
  /** If set, type is enforced and selection is hidden. */
  forcedType?: JsonSchemaType;
  /** Hide title input for the root schema node. */
  hideTitle?: boolean;
  /** Hide description input and divider for the root schema node. */
  hideDescription?: boolean;
  /** Prevent infinite/deep UIs */
  depth?: number;
  maxDepth?: number;
  /** Display schema without allowing edits. */
  readOnly?: boolean;
};

function SchemaNodeEditor({
  name,
  label,
  forcedType,
  depth = 0,
  maxDepth = 6,
  hideTitle = true,
  hideDescription = true,
  readOnly = false,
}: SchemaNodeEditorProps) {
  const { control, getValues, setValue } = useFormContext();
  const { t } = useTranslate();
  const type = useWatch({
    control,
    name: `${name}.type`,
  }) as JsonSchemaType | undefined;

  // Initialize / enforce shape
  React.useEffect(() => {
    const current = getValues(name) as SchemaNodeForm | undefined;
    const desiredType = forcedType ?? current?.type ?? "object";

    // If missing or malformed, set a full default node
    if (!current || typeof current !== "object" || !("type" in current)) {
      setValue(name, makeDefaultSchemaNode(desiredType), {
        shouldDirty: false,
        shouldTouch: false,
      });

      return;
    }

    // Enforce forced type (and reset structure safely)
    if (forcedType && current.type !== forcedType) {
      const next = makeDefaultSchemaNode(forcedType) as any;

      next.title = (current as any).title;
      next.description = (current as any).description;
      setValue(name, next, {
        shouldDirty: !readOnly,
        shouldTouch: !readOnly,
      });

      return;
    }

    // Patch missing structural fields for object/array
    if (desiredType === "object") {
      const props = getValues(`${name}.properties`);

      if (!Array.isArray(props)) {
        setValue(`${name}.properties`, [], {
          shouldDirty: false,
          shouldTouch: false,
        });
      }
      const ap = getValues(`${name}.additionalProperties`);

      if (typeof ap !== "boolean") {
        setValue(`${name}.additionalProperties`, true, {
          shouldDirty: false,
          shouldTouch: false,
        });
      }
    }

    if (desiredType === "array") {
      const items = getValues(`${name}.items`);

      if (!items || typeof items !== "object" || !("type" in items)) {
        setValue(`${name}.items`, makeDefaultSchemaNode("string"), {
          shouldDirty: false,
          shouldTouch: false,
        });
      }
    }
  }, [forcedType, getValues, name, setValue]);

  const effectiveType = forcedType ?? type ?? "object";
  const showTypeSelect = !forcedType;
  const isRootNode = depth === 0;
  const showTitleInput = !(isRootNode && hideTitle);
  const showDescriptionInput = !(isRootNode && hideDescription);
  const resetNodeToType = (nextType: JsonSchemaType) => {
    if (readOnly) {
      return;
    }

    const prev = (getValues(name) ?? {}) as any;
    const next = makeDefaultSchemaNode(nextType) as any;
    // Keep human fields across type changes

    next.title = prev.title;
    next.description = prev.description;
    setValue(name, next, { shouldDirty: true, shouldTouch: true });
  };
  const canGoDeeper = depth < maxDepth;

  return (
    <Paper variant="spaced">
      <Stack spacing={1.5}>
        {(label || depth === 0) && (
          <Typography variant={depth === 0 ? "h6" : "subtitle2"}>
            {label ?? t("label.schema", { defaultValue: "Schema" })}
          </Typography>
        )}

        {/* Type + title */}
        {(showTypeSelect || showTitleInput) && (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            {showTypeSelect && (
              <Controller
                control={control}
                name={`${name}.type`}
                render={() => (
                  <TextField
                    select
                    size="small"
                    label={t("label.type")}
                    disabled={readOnly}
                    value={effectiveType}
                    onChange={(e) =>
                      resetNodeToType(e.target.value as JsonSchemaType)
                    }
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            )}

            {showTitleInput && (
              <Controller
                control={control}
                name={`${name}.title`}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    size="small"
                    label={t("label.title")}
                    value={field.value ?? ""}
                    slotProps={{ input: { readOnly } }}
                  />
                )}
              />
            )}
          </Stack>
        )}

        {showDescriptionInput && (
          <>
            <Controller
              control={control}
              name={`${name}.description`}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  size="small"
                  label={t("label.description")}
                  multiline
                  minRows={2}
                  value={field.value ?? ""}
                  slotProps={{ input: { readOnly } }}
                />
              )}
            />

            <Divider />
          </>
        )}

        {/* Type-specific */}
        {effectiveType === "object" && canGoDeeper && (
          <ObjectSchemaBody
            name={name}
            depth={depth}
            maxDepth={maxDepth}
            readOnly={readOnly}
          />
        )}

        {effectiveType === "array" && canGoDeeper && (
          <ArraySchemaBody
            name={name}
            depth={depth}
            maxDepth={maxDepth}
            readOnly={readOnly}
          />
        )}

        {!canGoDeeper &&
          (effectiveType === "object" || effectiveType === "array") && (
            <Typography variant="body2" color="text.secondary">
              {t("message.max_depth_reached")}
            </Typography>
          )}
      </Stack>
    </Paper>
  );
}

function ObjectSchemaBody({
  name,
  depth,
  maxDepth,
  readOnly,
}: {
  name: string;
  depth: number;
  maxDepth: number;
  readOnly: boolean;
}) {
  const { control, getValues } = useFormContext();
  const { t } = useTranslate();
  const propertiesPath = `${name}.properties` as any;
  const { fields, append, remove } = useFieldArray({
    control,
    name: propertiesPath,
  });
  const addProperty = () => {
    append({
      key: "",
      required: false,
      schema: makeDefaultSchemaNode("string"),
    } satisfies PropertyEntryForm);
  };

  return (
    <Stack spacing={1.5}>
      <Controller
        control={control}
        name={`${name}.additionalProperties`}
        render={({ field }) => (
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(field.value)}
                disabled={readOnly}
                onChange={(_, checked) => field.onChange(checked)}
              />
            }
            label={t("label.allow_additional_properties")}
          />
        )}
      />

      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle1">{t("label.properties")}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={addProperty}
          disabled={readOnly}
          size="small"
        >
          {t("button.add_property")}
        </Button>
      </Stack>

      {fields.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t("message.no_properties_yet")}
        </Typography>
      ) : (
        <Stack spacing={1}>
          {fields.map((f, index) => (
            <PropertyEntryEditor
              key={f.id}
              objectName={name}
              index={index}
              onRemove={() => remove(index)}
              depth={depth}
              maxDepth={maxDepth}
              readOnly={readOnly}
              getAllProperties={() =>
                (getValues(propertiesPath) as PropertyEntryForm[]) ?? []
              }
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function PropertyEntryEditor({
  objectName,
  index,
  onRemove,
  depth,
  maxDepth,
  readOnly,
  getAllProperties,
}: {
  objectName: string;
  index: number;
  onRemove: () => void;
  depth: number;
  maxDepth: number;
  readOnly: boolean;
  getAllProperties: () => PropertyEntryForm[];
}) {
  const { control, setValue } = useFormContext();
  const { t } = useTranslate();
  const entryPath = `${objectName}.properties.${index}`;
  const keyValue = useWatch({
    control,
    name: `${entryPath}.key`,
  }) as string | undefined;
  const titleValue = useWatch({
    control,
    name: `${entryPath}.schema.title`,
  }) as string | undefined;
  const schemaType = useWatch({
    control,
    name: `${entryPath}.schema.type`,
  }) as JsonSchemaType | undefined;
  const previousKeyRef = React.useRef<string | undefined>(undefined);
  const summaryKey = keyValue?.trim()
    ? keyValue.trim()
    : `(${t("label.unnamed")})`;
  const summary = summaryKey + (schemaType ? ` : ${schemaType}` : "");

  React.useEffect(() => {
    if (readOnly) {
      return;
    }

    const key = (keyValue ?? "").trim();

    if (!key) {
      previousKeyRef.current = keyValue;

      return;
    }

    const autoTitle = capitalizeFirstLetter(key);
    const previousKey = (previousKeyRef.current ?? "").trim();
    const previousAutoTitle = previousKey
      ? capitalizeFirstLetter(previousKey)
      : "";
    const currentTitle = (titleValue ?? "").trim();

    if (
      (!currentTitle || currentTitle === previousAutoTitle) &&
      currentTitle !== autoTitle
    ) {
      setValue(`${entryPath}.schema.title`, autoTitle, {
        shouldDirty: true,
        shouldTouch: false,
      });
    }

    previousKeyRef.current = keyValue;
  }, [entryPath, keyValue, readOnly, setValue, titleValue]);

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2">{summary}</Typography>
      </AccordionSummary>

      <AccordionDetails>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Controller
              control={control}
              name={`${entryPath}.key`}
              rules={{
                required: t("message.property_name_is_required"),
                validate: (value) => {
                  const key = (value ?? "").trim();

                  if (!key) return t("message.property_name_is_required");

                  const all = getAllProperties();
                  const dupes = all.filter(
                    (p) => (p.key ?? "").trim() === key,
                  ).length;

                  if (dupes > 1)
                    return t("message.property_name_must_be_unique");

                  return true;
                },
              }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  size="small"
                  label={t("label.property_name")}
                  value={field.value ?? ""}
                  slotProps={{ input: { readOnly } }}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={control}
              name={`${entryPath}.required`}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(field.value)}
                      disabled={readOnly}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("label.required")}
                />
              )}
            />

            <Box sx={{ flex: 1 }} />

            <IconButton
              onClick={onRemove}
              disabled={readOnly}
              color="error"
              aria-label={t("button.remove_property")}
            >
              <DeleteIcon />
            </IconButton>
          </Stack>

          {/* Property schema editor (type/title/description + nested if object/array) */}
          <Box sx={{ pl: 0, borderLeft: 0 }}>
            <SchemaNodeEditor
              name={`${entryPath}.schema`}
              label={t("label.property_schema")}
              depth={depth + 1}
              maxDepth={maxDepth}
              readOnly={readOnly}
            />
          </Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

function ArraySchemaBody({
  name,
  depth,
  maxDepth,
  readOnly,
}: {
  name: string;
  depth: number;
  maxDepth: number;
  readOnly: boolean;
}) {
  const { t } = useTranslate();

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle1">{t("label.items")}</Typography>
      <SchemaNodeEditor
        name={`${name}.items`}
        label={t("label.items_schema")}
        depth={depth + 1}
        maxDepth={maxDepth}
        readOnly={readOnly}
      />
    </Stack>
  );
}

/**
 * Main component: builds a JSON Schema for a Record<string, any> (root object).
 * Use it inside a react-hook-form <FormProvider>.
 */
export function JsonSchemaObjectBuilder({
  name,
  label,
  maxDepth = 6,
  hideTitle = true,
  hideDescription = true,
  readOnly = false,
}: {
  name: string;
  label?: string;
  maxDepth?: number;
  hideTitle?: boolean;
  hideDescription?: boolean;
  readOnly?: boolean;
}) {
  const { t } = useTranslate();
  const resolvedLabel =
    label ??
    t("label.json_schema_object", { defaultValue: "JSON Schema (Object)" });

  return (
    <SchemaNodeEditor
      name={name}
      label={resolvedLabel}
      forcedType="object"
      depth={0}
      maxDepth={maxDepth}
      hideTitle={hideTitle}
      hideDescription={hideDescription}
      readOnly={readOnly}
    />
  );
}
