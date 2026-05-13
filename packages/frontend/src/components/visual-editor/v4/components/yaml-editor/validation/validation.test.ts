/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { describe, expect, it, vi } from "vitest";

import type { IAction } from "@/types/action.types";

import { YAML_WORKFLOW_VALIDATION_OWNER } from "../constants";

import { applyWorkflowValidationMarkers } from "./validation";

const makeAction = (name: string): IAction =>
  ({
    name,
    inputSchema: {},
    settingSchema: {},
    outputSchema: {},
  }) as IAction;

describe("yaml validation markers", () => {
  it("targets unknown action markers under defs.<task>.action paths", () => {
    const setModelMarkers = vi.fn();
    const model = {} as editor.ITextModel;
    const editorInstance = {
      getModel: () => model,
    } as editor.IStandaloneCodeEditor;
    const monacoInstance = {
      MarkerSeverity: {
        Error: 8,
      },
      editor: {
        setModelMarkers,
      },
    } as unknown as Monaco;
    const yaml = [
      "defs:",
      "  task_alpha:",
      "    kind: task",
      "    action: missing_action",
      "flow:",
      "  - do: task_alpha",
      "outputs:",
      '  result: "=$output.task_alpha"',
    ].join("\n");

    applyWorkflowValidationMarkers({
      editorInstance,
      monacoInstance,
      yaml,
      actions: [makeAction("known_action")],
    });

    expect(setModelMarkers).toHaveBeenCalledTimes(1);
    const [targetModel, owner, markers] = setModelMarkers.mock.calls[0] as [
      editor.ITextModel,
      string,
      editor.IMarkerData[],
    ];

    expect(targetModel).toBe(model);
    expect(owner).toBe(YAML_WORKFLOW_VALIDATION_OWNER);
    expect(markers).toHaveLength(1);
    expect(markers[0]?.message).toContain('Unknown action: "missing_action"');
    expect(markers[0]?.startLineNumber).toBe(4);
    expect((markers[0]?.endLineNumber ?? 0) >= 4).toBe(true);
  });

  it("flags non-snake-case task names using agentic naming rules", () => {
    const setModelMarkers = vi.fn();
    const model = {} as editor.ITextModel;
    const editorInstance = {
      getModel: () => model,
    } as editor.IStandaloneCodeEditor;
    const monacoInstance = {
      MarkerSeverity: {
        Error: 8,
      },
      editor: {
        setModelMarkers,
      },
    } as unknown as Monaco;
    const yaml = [
      "defs:",
      "  taskalpha:",
      "    kind: task",
      "    action: known_action",
      "flow:",
      "  - do: taskalpha",
      "outputs:",
      '  result: "=$output.taskalpha"',
    ].join("\n");

    applyWorkflowValidationMarkers({
      editorInstance,
      monacoInstance,
      yaml,
      actions: [makeAction("known_action")],
    });

    const [, , markers] = setModelMarkers.mock.calls[0] as [
      editor.ITextModel,
      string,
      editor.IMarkerData[],
    ];

    expect(markers[0]?.message).toBe(
      'action name must be snake_case with at least one underscore. Received: "taskalpha"',
    );
  });
});
