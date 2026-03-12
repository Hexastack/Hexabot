/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  TASK_KIND,
  type FlowStep,
  type WorkflowDefinition,
} from '../dsl.types';

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const replaceOutputTaskReferences = (
  source: string,
  currentTaskName: string,
  nextTaskName: string,
): string => {
  if (!source.includes('$output')) {
    return source;
  }

  const escapedTaskName = escapeRegExp(currentTaskName);
  const dotNotationPattern = new RegExp(
    `(\\$output\\.)${escapedTaskName}(?=[^a-zA-Z0-9_]|$)`,
    'g',
  );
  const singleQuotePattern = new RegExp(
    `(\\$output\\s*\\[\\s*')${escapedTaskName}('\\s*\\])`,
    'g',
  );
  const doubleQuotePattern = new RegExp(
    `(\\$output\\s*\\[\\s*")${escapedTaskName}("\\s*\\])`,
    'g',
  );

  return source
    .replace(dotNotationPattern, `$1${nextTaskName}`)
    .replace(singleQuotePattern, `$1${nextTaskName}$2`)
    .replace(doubleQuotePattern, `$1${nextTaskName}$2`);
};
const renameTaskInFlow = (
  steps: WorkflowDefinition['flow'],
  currentTaskName: string,
  nextTaskName: string,
): WorkflowDefinition['flow'] => {
  return steps.map((step): FlowStep => {
    if ('do' in step) {
      return {
        ...step,
        do: step.do === currentTaskName ? nextTaskName : step.do,
      };
    }

    if ('parallel' in step) {
      return {
        ...step,
        parallel: {
          ...step.parallel,
          steps: renameTaskInFlow(
            step.parallel.steps,
            currentTaskName,
            nextTaskName,
          ),
        },
      };
    }

    if ('conditional' in step) {
      return {
        ...step,
        conditional: {
          ...step.conditional,
          when: step.conditional.when.map((branch) => ({
            ...branch,
            steps: renameTaskInFlow(
              branch.steps,
              currentTaskName,
              nextTaskName,
            ),
          })),
        },
      };
    }

    if ('loop' in step) {
      return {
        ...step,
        loop: {
          ...step.loop,
          steps: renameTaskInFlow(
            step.loop.steps,
            currentTaskName,
            nextTaskName,
          ),
        },
      };
    }

    return step;
  });
};
const renameOutputTaskReferencesInValue = (
  value: unknown,
  currentTaskName: string,
  nextTaskName: string,
): unknown => {
  if (typeof value === 'string') {
    return replaceOutputTaskReferences(value, currentTaskName, nextTaskName);
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      renameOutputTaskReferencesInValue(item, currentTaskName, nextTaskName),
    );
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.entries(value).reduce<Record<string, unknown>>(
    (acc, [key, nestedValue]) => {
      acc[key] = renameOutputTaskReferencesInValue(
        nestedValue,
        currentTaskName,
        nextTaskName,
      );

      return acc;
    },
    {},
  );
};

export const safeRenameTaskInDefinition = (
  definition: WorkflowDefinition,
  currentTaskName: string,
  nextTaskName: string,
): WorkflowDefinition => {
  if (currentTaskName === nextTaskName) {
    return definition;
  }

  if (!Object.prototype.hasOwnProperty.call(definition.defs, currentTaskName)) {
    return definition;
  }

  const currentDefinition = definition.defs[currentTaskName];
  if (!currentDefinition || currentDefinition.kind !== TASK_KIND) {
    return definition;
  }

  const renamedDefs = Object.entries(definition.defs).reduce<
    WorkflowDefinition['defs']
  >((acc, [defName, def]) => {
    acc[defName === currentTaskName ? nextTaskName : defName] = def;

    return acc;
  }, {});
  const definitionWithRenamedFlow: WorkflowDefinition = {
    ...definition,
    defs: renamedDefs,
    flow: renameTaskInFlow(definition.flow, currentTaskName, nextTaskName),
  };

  return renameOutputTaskReferencesInValue(
    definitionWithRenamedFlow,
    currentTaskName,
    nextTaskName,
  ) as WorkflowDefinition;
};
