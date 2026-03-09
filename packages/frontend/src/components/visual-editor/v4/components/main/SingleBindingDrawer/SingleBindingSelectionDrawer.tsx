/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  type JsonValue,
  type WorkflowDefinition,
} from "@hexabot-ai/agentic";
import {
  Box,
  Button,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { type RJSFSchema } from "@rjsf/utils";
import { ArrowLeft, Plus, Save } from "lucide-react";
import type { JSONSchema } from "monaco-yaml";
import { useEffect, useMemo, useState } from "react";

import { withDrawerLayout } from "@/app-components/drawers/DrawerLayout";
import { EditableTypography } from "@/app-components/inputs/EditableTypography";
import { JsonSchemaForm } from "@/app-components/inputs/JsonSchemaForm";
import { useTranslate } from "@/hooks/useTranslate";

import { humanizeBindingKind } from "../../../utils/binding-kind.utils";
import {
  createUniqueBindingName,
  normalizeBindingName,
} from "../../../utils/binding-name.utils";
import {
  extractUiSchema,
  getSchemaDefaults,
} from "../../../utils/schema-defaults.utils";

type SingleBindingSelectionDrawerBaseProps = {
  availableBindings: string[];
  bindingKind: string;
  bindingLabel: string;
  defs?: WorkflowDefinition["defs"];
  bindingSchema?: JSONSchema;
  editingBindingName?: string | null;
  isSaving?: boolean;
  onSelectBinding?: (bindingName: string) => void;
  onCreateBindingDefinition?: (
    bindingName: string,
    bindingDefinition: Record<string, unknown>,
    description?: string,
  ) => void;
  onUpdateBindingDefinition?: (
    currentBindingName: string,
    nextBindingName: string,
    bindingDefinition: Record<string, unknown>,
    description?: string,
  ) => void;
};

type SingleBindingSelectionDrawerContentProps =
  SingleBindingSelectionDrawerBaseProps & {
    isOpen: boolean;
  };

type SingleBindingSelectionDrawerProps =
  SingleBindingSelectionDrawerBaseProps & {
    drawerId?: string;
    open: boolean;
    onClose: () => void;
  };

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
};
const toBindingFormData = (definition: Record<string, unknown>) => {
  const { kind: _kind, description: _description, ...rest } = definition;

  return rest;
};
const SingleBindingSelectionDrawerContent = ({
  isOpen,
  availableBindings,
  bindingKind,
  bindingLabel,
  defs,
  bindingSchema,
  editingBindingName,
  isSaving,
  onSelectBinding,
  onCreateBindingDefinition,
  onUpdateBindingDefinition,
}: SingleBindingSelectionDrawerContentProps) => {
  const { t } = useTranslate();
  const [mode, setMode] = useState<"select" | "create">("select");
  const [bindingName, setBindingName] = useState("");
  const [bindingDescription, setBindingDescription] = useState("");
  const [bindingData, setBindingData] = useState<Record<string, unknown>>({});
  const [hasVisibleErrors, setHasVisibleErrors] = useState(false);
  const isEditing = Boolean(editingBindingName);
  const bindingLabelLower = useMemo(
    () => bindingLabel.toLowerCase(),
    [bindingLabel],
  );
  const normalizedBindingName = useMemo(
    () => normalizeBindingName(bindingName),
    [bindingName],
  );
  const normalizedEditingBindingName = useMemo(
    () =>
      editingBindingName ? normalizeBindingName(editingBindingName) : undefined,
    [editingBindingName],
  );
  const bindingNameError = useMemo(() => {
    if (!bindingName.trim()) {
      return t(
        "visual_editor.single_binding_drawer.form.binding_id.errors.required",
        { bindingLabel } as Parameters<typeof t>[1],
      );
    }

    if (!normalizedBindingName) {
      return t(
        "visual_editor.single_binding_drawer.form.binding_id.errors.snake_case",
        { bindingLabel } as Parameters<typeof t>[1],
      );
    }

    if (
      Object.prototype.hasOwnProperty.call(defs ?? {}, normalizedBindingName) &&
      normalizedBindingName !== normalizedEditingBindingName
    ) {
      return t(
        "visual_editor.single_binding_drawer.form.binding_id.errors.unique",
      );
    }

    return null;
  }, [
    bindingLabel,
    bindingName,
    defs,
    normalizedBindingName,
    normalizedEditingBindingName,
    t,
  ]);
  const bindingUiSchema = useMemo(
    () => extractUiSchema(bindingSchema as RJSFSchema | undefined),
    [bindingSchema],
  );
  const defaultBindingData = useMemo(() => {
    if (!bindingSchema) {
      return {};
    }

    return getSchemaDefaults<Record<string, JsonValue>>(bindingSchema) ?? {};
  }, [bindingSchema]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (editingBindingName) {
      const existingDefinition = asRecord(defs?.[editingBindingName]);
      const existingDescription =
        typeof existingDefinition?.description === "string"
          ? existingDefinition.description
          : "";

      setBindingName(editingBindingName);
      setBindingDescription(existingDescription);
      setBindingData(
        existingDefinition ? toBindingFormData(existingDefinition) : {},
      );
      setMode("create");
      setHasVisibleErrors(false);

      return;
    }

    setBindingName(
      createUniqueBindingName(
        normalizeBindingName(bindingKind) || "binding",
        defs,
      ),
    );
    setBindingDescription("");
    setBindingData(defaultBindingData);
    setMode(availableBindings.length > 0 ? "select" : "create");
    setHasVisibleErrors(false);
  }, [
    availableBindings.length,
    bindingKind,
    defaultBindingData,
    defs,
    editingBindingName,
    isOpen,
  ]);

  const handleSaveBindingDefinition = () => {
    if (
      !bindingSchema ||
      isSaving ||
      hasVisibleErrors ||
      !normalizedBindingName ||
      bindingNameError
    ) {
      return;
    }

    if (isEditing && editingBindingName && onUpdateBindingDefinition) {
      onUpdateBindingDefinition(
        editingBindingName,
        normalizedBindingName,
        bindingData,
        bindingDescription,
      );

      return;
    }

    onCreateBindingDefinition?.(
      normalizedBindingName,
      bindingData,
      bindingDescription,
    );
  };

  if (isEditing || mode === "create") {
    return (
      <Stack spacing={1.5}>
        {!isEditing ? (
          <Button
            variant="text"
            size="small"
            startIcon={<ArrowLeft size={16} />}
            onClick={() => {
              setMode("select");
            }}
            sx={{ alignSelf: "flex-start" }}
          >
            {t(
              "visual_editor.single_binding_drawer.form.back",
              { bindingLabelLower } as Parameters<typeof t>[1],
            )}
          </Button>
        ) : null}
        <Stack spacing={0.25} minWidth={0}>
          <EditableTypography
            component="div"
            variant="subtitle1"
            value={bindingName}
            onCommit={setBindingName}
            placeholder={t(
              "visual_editor.single_binding_drawer.form.binding_id.label",
              { bindingLabel } as Parameters<typeof t>[1],
            )}
            disabled={isSaving}
            sx={{ fontFamily: "monospace" }}
          />
          {bindingNameError && (
            <Typography variant="caption" color="error.main">
              {bindingNameError}
            </Typography>
          )}
          <EditableTypography
            component="div"
            variant="body2"
            multiline
            value={bindingDescription}
            onCommit={setBindingDescription}
            placeholder={t(
              "visual_editor.single_binding_drawer.form.description.placeholder",
              { bindingLabelLower } as Parameters<typeof t>[1],
            )}
            disabled={isSaving}
            color={
              bindingDescription.trim() ? "text.primary" : "text.secondary"
            }
          />
        </Stack>
        {bindingSchema ? (
          <JsonSchemaForm
            schema={bindingSchema as RJSFSchema}
            formData={bindingData}
            onFormDataChange={setBindingData}
            onVisibleErrorsChange={setHasVisibleErrors}
            uiSchema={bindingUiSchema}
            idPrefix="single-binding-selection-drawer"
          />
        ) : (
          <Typography variant="body2" color="text.secondary" px={1}>
            {t(
              "visual_editor.single_binding_drawer.form.empty_schema",
              { bindingLabel } as Parameters<typeof t>[1],
            )}
          </Typography>
        )}
        <Box display="flex" justifyContent="center">
          <Button
            variant="contained"
            size="large"
            onClick={handleSaveBindingDefinition}
            disabled={
              (!isEditing && !onCreateBindingDefinition) ||
              (isEditing && !onUpdateBindingDefinition) ||
              !bindingSchema ||
              isSaving ||
              Boolean(bindingNameError) ||
              hasVisibleErrors
            }
            startIcon={<Save size={18} />}
            sx={{ minWidth: 220 }}
          >
            {t("button.save")}
          </Button>
        </Box>
      </Stack>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Button
        variant="contained"
        size="large"
        startIcon={<Plus size={18} />}
        onClick={() => {
          setMode("create");
        }}
        disabled={!onCreateBindingDefinition || !bindingSchema || isSaving}
      >
        {t(
          "visual_editor.single_binding_drawer.add_new",
          { bindingLabelLower } as Parameters<typeof t>[1],
        )}
      </Button>
      <Divider />
      {availableBindings.length === 0 ? (
        <Typography variant="body2" color="text.secondary" p={1}>
          {t(
            "visual_editor.single_binding_drawer.empty",
            { bindingLabelLower } as Parameters<typeof t>[1],
          )}
        </Typography>
      ) : (
        <List disablePadding>
          {availableBindings.map((selectedBindingName) => (
            <ListItemButton
              key={selectedBindingName}
              onClick={() => {
                onSelectBinding?.(selectedBindingName);
              }}
              disabled={isSaving}
            >
              <ListItemText
                primaryTypographyProps={{ fontFamily: "monospace" }}
                primary={selectedBindingName}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Stack>
  );
};
const SingleBindingSelectionDrawerLayout = withDrawerLayout(
  SingleBindingSelectionDrawerContent,
);

export const SingleBindingSelectionDrawer = ({
  availableBindings,
  bindingKind,
  bindingLabel,
  defs,
  bindingSchema,
  editingBindingName,
  isSaving,
  drawerId,
  open,
  onClose,
  onSelectBinding,
  onCreateBindingDefinition,
  onUpdateBindingDefinition,
}: SingleBindingSelectionDrawerProps) => {
  const { t } = useTranslate();
  const normalizedBindingLabel = bindingLabel || humanizeBindingKind(bindingKind);
  const title = editingBindingName
    ? t("visual_editor.single_binding_drawer.title.edit", {
        bindingLabel: normalizedBindingLabel,
      } as Parameters<typeof t>[1])
    : t("visual_editor.single_binding_drawer.title.create", {
        bindingLabel: normalizedBindingLabel,
      } as Parameters<typeof t>[1]);

  return (
    <SingleBindingSelectionDrawerLayout
      isOpen={open}
      availableBindings={availableBindings}
      bindingKind={bindingKind}
      bindingLabel={normalizedBindingLabel}
      defs={defs}
      bindingSchema={bindingSchema}
      editingBindingName={editingBindingName}
      isSaving={isSaving}
      onSelectBinding={onSelectBinding}
      onCreateBindingDefinition={onCreateBindingDefinition}
      onUpdateBindingDefinition={onUpdateBindingDefinition}
      drawerId={drawerId}
      open={open}
      onClose={onClose}
      title={title}
      closeLabel={t("button.close")}
    />
  );
};
