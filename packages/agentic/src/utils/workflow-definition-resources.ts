/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { DefDefinition, WorkflowDefinition } from '../dsl.types';

export type WorkflowDefinitionResourceDescriptor = {
  kind: string;
  settingsKey: string;
};

export type WorkflowDefinitionResourceRefs = Record<string, string[]>;

export type WorkflowDefinitionResourceIdMaps = Record<
  string,
  Record<string, string>
>;

const getSettingsRef = (
  definition: DefDefinition,
  settingsKey: string,
): string | null => {
  const settings = definition.settings;
  if (!settings || typeof settings !== 'object') {
    return null;
  }

  const value = (settings as Record<string, unknown>)[settingsKey];

  return typeof value === 'string' && value.trim() ? value : null;
};

/**
 * Collect external resource IDs referenced by workflow definition defs.
 */
export const collectWorkflowDefinitionResourceRefs = (
  definition: WorkflowDefinition,
  descriptors: WorkflowDefinitionResourceDescriptor[],
): WorkflowDefinitionResourceRefs => {
  const result = Object.fromEntries(
    descriptors.map((descriptor) => [descriptor.kind, new Set<string>()]),
  ) as Record<string, Set<string>>;

  for (const def of Object.values(definition.defs ?? {})) {
    for (const descriptor of descriptors) {
      if (def.kind !== descriptor.kind) {
        continue;
      }

      const ref = getSettingsRef(def, descriptor.settingsKey);
      if (ref) {
        result[descriptor.kind].add(ref);
      }
    }
  }

  return Object.fromEntries(
    Object.entries(result).map(([kind, refs]) => [kind, Array.from(refs)]),
  );
};

/**
 * Rewrite external resource IDs referenced by workflow definition defs.
 */
export const remapWorkflowDefinitionResourceRefs = (
  definition: WorkflowDefinition,
  descriptors: WorkflowDefinitionResourceDescriptor[],
  idMaps: WorkflowDefinitionResourceIdMaps,
): WorkflowDefinition => {
  let didChange = false;
  const nextDefs = Object.fromEntries(
    Object.entries(definition.defs ?? {}).map(([defName, def]) => {
      const descriptor = descriptors.find((item) => item.kind === def.kind);
      if (!descriptor) {
        return [defName, def];
      }

      const currentRef = getSettingsRef(def, descriptor.settingsKey);
      const nextRef = currentRef
        ? idMaps[descriptor.kind]?.[currentRef]
        : undefined;
      if (!currentRef || !nextRef || nextRef === currentRef) {
        return [defName, def];
      }

      didChange = true;

      return [
        defName,
        {
          ...def,
          settings: {
            ...(def.settings ?? {}),
            [descriptor.settingsKey]: nextRef,
          },
        },
      ];
    }),
  ) as WorkflowDefinition['defs'];

  if (!didChange) {
    return definition;
  }

  return {
    ...definition,
    defs: nextDefs,
  };
};
