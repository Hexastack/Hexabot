/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowDefinitionSchema } from "@hexabot-ai/agentic";
import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import type { Node } from "yaml";
// eslint-disable-next-line no-duplicate-imports
import { LineCounter, parseDocument } from "yaml";

import { YAML_WORKFLOW_VALIDATION_OWNER } from "./constants";

type ApplyWorkflowValidationMarkersOptions = {
  editorInstance: editor.IStandaloneCodeEditor | null;
  monacoInstance: Monaco | null;
  yaml: string;
};

type ReferencePath = Array<string | number>;
type TaskReference = { path: ReferencePath; taskId: string };

const DEFAULT_RANGE = {
  startLineNumber: 1,
  startColumn: 1,
  endLineNumber: 1,
  endColumn: 2,
};
const getRangeFromNode = (
  node: Node | null | undefined,
  lineCounter: LineCounter,
) => {
  if (!node?.range) return null;
  const [startOffset, , endOffset] = node.range;
  const startPos = lineCounter.linePos(startOffset);
  const endPos = lineCounter.linePos(endOffset);
  const startLineNumber = startPos.line || 1;
  const startColumn = startPos.col || 1;
  const endLineNumber = endPos.line || startLineNumber;
  let endColumn = endPos.col || startColumn + 1;

  if (endLineNumber === startLineNumber && endColumn <= startColumn) {
    endColumn = startColumn + 1;
  }

  return { startLineNumber, startColumn, endLineNumber, endColumn };
};
const getRangeForPath = (
  doc: ReturnType<typeof parseDocument>,
  path: ReferencePath,
  lineCounter: LineCounter,
) => {
  const directNode = doc.getIn(path, true) as Node | undefined;
  const directRange = getRangeFromNode(directNode, lineCounter);

  if (directRange) {
    return directRange;
  }

  if (path.length > 0) {
    const parentNode = doc.getIn(path.slice(0, -1), true) as Node | undefined;
    const parentRange = getRangeFromNode(parentNode, lineCounter);

    if (parentRange) {
      return parentRange;
    }
  }

  return DEFAULT_RANGE;
};
const collectTaskReferences = (
  steps: unknown,
  basePath: ReferencePath,
): TaskReference[] => {
  if (!Array.isArray(steps)) return [];
  const refs: TaskReference[] = [];

  steps.forEach((step, index) => {
    if (!step || typeof step !== "object") return;
    const stepPath = [...basePath, index];
    const stepRecord = step as Record<string, unknown>;

    if (typeof stepRecord.do === "string") {
      refs.push({ path: [...stepPath, "do"], taskId: stepRecord.do });

      return;
    }

    if (stepRecord.parallel && typeof stepRecord.parallel === "object") {
      const parallel = stepRecord.parallel as { steps?: unknown };

      refs.push(
        ...collectTaskReferences(parallel.steps, [
          ...stepPath,
          "parallel",
          "steps",
        ]),
      );

      return;
    }

    if (stepRecord.conditional && typeof stepRecord.conditional === "object") {
      const conditional = stepRecord.conditional as { when?: unknown };

      if (Array.isArray(conditional.when)) {
        conditional.when.forEach((branch, branchIndex) => {
          if (!branch || typeof branch !== "object") return;
          const branchRecord = branch as { steps?: unknown };

          refs.push(
            ...collectTaskReferences(branchRecord.steps, [
              ...stepPath,
              "conditional",
              "when",
              branchIndex,
              "steps",
            ]),
          );
        });
      }

      return;
    }

    if (stepRecord.loop && typeof stepRecord.loop === "object") {
      const loop = stepRecord.loop as { steps?: unknown };

      refs.push(
        ...collectTaskReferences(loop.steps, [...stepPath, "loop", "steps"]),
      );
    }
  });

  return refs;
};

export const applyWorkflowValidationMarkers = ({
  editorInstance,
  monacoInstance,
  yaml,
}: ApplyWorkflowValidationMarkersOptions) => {
  if (!editorInstance || !monacoInstance) return;
  const model = editorInstance.getModel();

  if (!model) return;

  const lineCounter = new LineCounter();
  const doc = parseDocument(yaml, { lineCounter });

  if (doc.errors.length > 0) {
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
    parsed.error.issues.forEach((issue) => {
      if (
        issue.code !== "custom" ||
        !issue.message.startsWith("Invalid JSONata expression")
      ) {
        return;
      }

      markers.push({
        ...getRangeForPath(doc, issue.path, lineCounter),
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

  references.forEach((reference) => {
    if (knownTasks.has(reference.taskId)) return;

    markers.push({
      ...getRangeForPath(doc, reference.path, lineCounter),
      message: `Unknown task referenced: "${reference.taskId}"`,
      severity: monacoInstance.MarkerSeverity.Error,
    });
  });

  monacoInstance.editor.setModelMarkers(
    model,
    YAML_WORKFLOW_VALIDATION_OWNER,
    markers,
  );
};
