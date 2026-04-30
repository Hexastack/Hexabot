/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import JsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";

import YamlWorker from "./yaml.worker.entry?worker";

type MonacoEnvironment = {
  getWorker?: (moduleId: string, label: string) => Worker | Promise<Worker>;
};

const globalMonaco = globalThis as typeof globalThis & {
  MonacoEnvironment?: MonacoEnvironment;
};
const existingGetWorker = globalMonaco.MonacoEnvironment?.getWorker;
const ensureLegacyWorkerCompat = () => {
  const monacoWithCreateWorker = monaco as typeof monaco & {
    createWebWorker?: (options: unknown) => unknown;
  };

  if (!monacoWithCreateWorker.createWebWorker) {
    return;
  }

  const originalCreateWebWorker = monaco.editor
    .createWebWorker as typeof monaco.editor.createWebWorker & {
    __hexabotPatched?: boolean;
  };

  if (originalCreateWebWorker.__hexabotPatched) {
    return;
  }

  const patchedCreateWebWorker = ((options: unknown) => {
    if (
      options &&
      typeof options === "object" &&
      "moduleId" in options &&
      !("worker" in options)
    ) {
      return monacoWithCreateWorker.createWebWorker?.(options);
    }

    return originalCreateWebWorker(
      options as Parameters<typeof monaco.editor.createWebWorker>[0],
    );
  }) as typeof monaco.editor.createWebWorker & { __hexabotPatched?: boolean };

  patchedCreateWebWorker.__hexabotPatched = true;
  monaco.editor.createWebWorker = patchedCreateWebWorker;
};

ensureLegacyWorkerCompat();

globalMonaco.MonacoEnvironment = {
  ...globalMonaco.MonacoEnvironment,
  getWorker: (moduleId: string, label: string) => {
    if (label === "yaml" || moduleId === "monaco-yaml/yaml.worker") {
      return new YamlWorker();
    }

    if (label === "json") {
      return new JsonWorker();
    }

    if (existingGetWorker) {
      return existingGetWorker(moduleId, label);
    }

    return new EditorWorker();
  },
};
