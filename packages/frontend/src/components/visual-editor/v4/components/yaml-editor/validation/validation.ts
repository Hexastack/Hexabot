/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowDefinitionSchema } from "@hexabot-ai/agentic";
import type { Monaco } from "@monaco-editor/react";
import type { Schema } from "jsonschema";
import type { editor } from "monaco-editor";
import { LineCounter, parseDocument } from "yaml";

import type { IAction } from "@/types/action.types";

import { YAML_WORKFLOW_VALIDATION_OWNER } from "../constants";

import { getRangeForPath, type ReferencePath } from "./validation.paths";
import { appendSchemaMarkers, isSchemaLike } from "./validation.schema";
import { collectTaskReferences } from "./validation.tasks";

type ApplyWorkflowValidationMarkersOptions = {
  editorInstance: editor.IStandaloneCodeEditor | null;
  monacoInstance: Monaco | null;
  yaml: string;
  actions?: IAction[];
};

// YAML paths only support string/number keys, so drop symbol segments.
const toReferencePath = (path: readonly PropertyKey[]): ReferencePath =>
  path.filter(
    (segment): segment is string | number =>
      typeof segment === "string" || typeof segment === "number",
  );

export const applyWorkflowValidationMarkers = ({
  editorInstance,
  monacoInstance,
  yaml,
  actions,
}: ApplyWorkflowValidationMarkersOptions) => {
  if (!editorInstance || !monacoInstance) return;
  const model = editorInstance.getModel();

  if (!model) return;

  // Build a YAML AST so validation errors can be mapped to source locations.
  const lineCounter = new LineCounter();
  const doc = parseDocument(yaml, { lineCounter });

  if (doc.errors.length > 0) {
    // YAML syntax issues are surfaced elsewhere, so clear workflow markers here.
    monacoInstance.editor.setModelMarkers(
      model,
      YAML_WORKFLOW_VALIDATION_OWNER,
      [],
    );

    return;
  }

  const markers: editor.IMarkerData[] = [];
  const parsed = WorkflowDefinitionSchema.safeParse(doc.toJS());

  if (!parsed.success) {
    // Only surface JSONata expression errors from the workflow schema.
    parsed.error.issues.forEach((issue) => {
      if (
        issue.code !== "custom" ||
        !issue.message.startsWith("Invalid JSONata expression")
      ) {
        return;
      }

      markers.push({
        ...getRangeForPath(doc, toReferencePath(issue.path), lineCounter),
        message: issue.message,
        severity: monacoInstance.MarkerSeverity.Error,
      });
    });

    monacoInstance.editor.setModelMarkers(
      model,
      YAML_WORKFLOW_VALIDATION_OWNER,
      markers,
    );

    return;
  }

  const knownTasks = new Set(Object.keys(parsed.data.tasks));
  const references = collectTaskReferences(parsed.data.flow, ["flow"]);
  const actionsByName =
    actions?.reduce<Record<string, IAction>>((acc, action) => {
      acc[action.name] = action;

      return acc;
    }, {}) ?? null;

  // Flag workflow references to tasks that are not defined.
  references.forEach((reference) => {
    if (knownTasks.has(reference.taskId)) return;

    markers.push({
      ...getRangeForPath(doc, reference.path, lineCounter),
      message: `Unknown task referenced: "${reference.taskId}"`,
      severity: monacoInstance.MarkerSeverity.Error,
    });
  });

  if (actionsByName) {
    // Validate task inputs/settings/outputs against action schemas.
    Object.entries(parsed.data.tasks).forEach(([taskName, task]) => {
      const actionName = task.action;
      const actionDefinition = actionsByName[actionName];
      const taskPath: ReferencePath = ["tasks", taskName];

      if (!actionDefinition) {
        markers.push({
          ...getRangeForPath(doc, [...taskPath, "action"], lineCounter),
          message: `Unknown action: "${actionName}"`,
          severity: monacoInstance.MarkerSeverity.Error,
        });

        return;
      }

      const inputSchema = actionDefinition.inputSchema;
      const outputSchema = actionDefinition.outputSchema;
      const settingSchema =
        actionDefinition.settingSchema ??
        (actionDefinition as IAction & { settingsSchema?: Schema })
          .settingsSchema;

      if (isSchemaLike(inputSchema)) {
        appendSchemaMarkers({
          section: "inputs",
          schema: inputSchema,
          instance: task.inputs ?? {},
          basePath: [...taskPath, "inputs"],
          doc,
          lineCounter,
          markers,
          monacoInstance,
        });
      }

      if (task.settings !== undefined && isSchemaLike(settingSchema)) {
        appendSchemaMarkers({
          section: "settings",
          schema: settingSchema,
          instance: task.settings,
          basePath: [...taskPath, "settings"],
          doc,
          lineCounter,
          markers,
          monacoInstance,
        });
      }

      if (task.outputs !== undefined && isSchemaLike(outputSchema)) {
        appendSchemaMarkers({
          section: "outputs",
          schema: outputSchema,
          instance: task.outputs,
          basePath: [...taskPath, "outputs"],
          doc,
          lineCounter,
          markers,
          monacoInstance,
          ignoreRequired: true,
        });
      }
    });
  }

  monacoInstance.editor.setModelMarkers(
    model,
    YAML_WORKFLOW_VALIDATION_OWNER,
    markers,
  );
};
