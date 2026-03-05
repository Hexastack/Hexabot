/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z, type ZodIssue } from 'zod';

export type BindingKindSchemas = Record<string, z.ZodTypeAny>;

export type InferWorkflowBindings<
  TBindingKinds extends BindingKindSchemas = BindingKindSchemas,
> = Partial<{
  [K in keyof TBindingKinds & string]: Record<
    string,
    z.infer<TBindingKinds[K]>
  >;
}>;

export type DefLike = {
  kind: string;
  description?: string;
  [key: string]: unknown;
};

export type TaskBindingReferences = Record<string, string[]>;

export type BindingAwareTaskLike = {
  bindings?: TaskBindingReferences;
};

export type BindingAwareWorkflowLike = {
  defs?: Record<string, DefLike>;
  tasks: Record<string, BindingAwareTaskLike>;
};

export type ResolvedBindingDef = {
  kind: string;
  payload: unknown;
};

export type ResolvedBindingDefs = Record<string, ResolvedBindingDef>;

export type CompiledTaskBindings = Record<string, Record<string, unknown>>;

type BindingValidationResult = {
  errors: string[];
  resolvedDefs: ResolvedBindingDefs;
};

const hasBindingsConfigured = (workflow: BindingAwareWorkflowLike): boolean => {
  if (workflow.defs && Object.keys(workflow.defs).length > 0) {
    return true;
  }

  return Object.values(workflow.tasks).some(
    (task) => task.bindings && Object.keys(task.bindings).length > 0,
  );
};
const formatZodIssues = (issues: ZodIssue[], prefix: string): string[] =>
  issues.map((issue) => {
    const path = issue.path.join('.') || '<root>';

    return `${prefix}.${path}: ${issue.message}`;
  });
const stripDefMeta = (definition: DefLike): unknown => {
  const { kind: _kind, description: _description, ...payload } = definition;

  return payload;
};
const collectDuplicateReferences = (refs: string[]): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const ref of refs) {
    if (seen.has(ref)) {
      duplicates.add(ref);
      continue;
    }

    seen.add(ref);
  }

  return Array.from(duplicates).sort();
};

export const validateAndResolveBindings = (
  workflow: BindingAwareWorkflowLike,
  bindingKinds?: BindingKindSchemas,
): BindingValidationResult => {
  const errors: string[] = [];
  const resolvedDefs: ResolvedBindingDefs = {};
  const defs = workflow.defs ?? {};
  const kinds = bindingKinds ?? {};
  const kindNames = Object.keys(kinds);
  const hasBindingUsage = hasBindingsConfigured(workflow);

  if (hasBindingUsage && kindNames.length === 0) {
    errors.push(
      'Workflows that declare defs or task bindings require a non-empty "bindingKinds" registry.',
    );
  }

  for (const [defName, defDefinition] of Object.entries(defs)) {
    const schema = kinds[defDefinition.kind];

    if (!schema) {
      errors.push(
        `defs.${defName}.kind: Unknown binding kind "${defDefinition.kind}".`,
      );
      continue;
    }

    const payload = stripDefMeta(defDefinition);
    const parsedPayload = schema.safeParse(payload);

    if (!parsedPayload.success) {
      errors.push(
        ...formatZodIssues(parsedPayload.error.issues, `defs.${defName}`),
      );
      continue;
    }

    resolvedDefs[defName] = {
      kind: defDefinition.kind,
      payload: parsedPayload.data,
    };
  }

  for (const [taskName, taskDefinition] of Object.entries(workflow.tasks)) {
    const taskBindings = taskDefinition.bindings;

    if (!taskBindings) {
      continue;
    }

    for (const [bindingKind, refs] of Object.entries(taskBindings)) {
      const schema = kinds[bindingKind];

      if (!schema) {
        errors.push(
          `tasks.${taskName}.bindings.${bindingKind}: Unknown binding kind "${bindingKind}".`,
        );
      }

      const duplicateRefs = collectDuplicateReferences(refs);
      if (duplicateRefs.length > 0) {
        errors.push(
          `tasks.${taskName}.bindings.${bindingKind}: Duplicate def reference(s): ${duplicateRefs.join(', ')}`,
        );
      }

      for (const ref of refs) {
        const definition = defs[ref];

        if (!definition) {
          errors.push(
            `tasks.${taskName}.bindings.${bindingKind}: Unknown def reference "${ref}".`,
          );
          continue;
        }

        if (definition.kind !== bindingKind) {
          errors.push(
            `tasks.${taskName}.bindings.${bindingKind}: Def "${ref}" has kind "${definition.kind}" and cannot be mounted as "${bindingKind}".`,
          );
        }
      }
    }
  }

  return { errors, resolvedDefs };
};

export const mountTaskBindings = (
  taskBindings: TaskBindingReferences | undefined,
  resolvedDefs: ResolvedBindingDefs,
): CompiledTaskBindings => {
  if (!taskBindings) {
    return {};
  }

  const mounted: CompiledTaskBindings = {};

  for (const [bindingKind, refs] of Object.entries(taskBindings)) {
    const mountedKindDefs: Record<string, unknown> = {};

    for (const ref of refs) {
      const resolvedDef = resolvedDefs[ref];

      if (!resolvedDef) {
        continue;
      }

      mountedKindDefs[ref] = resolvedDef.payload;
    }

    if (Object.keys(mountedKindDefs).length > 0) {
      mounted[bindingKind] = mountedKindDefs;
    }
  }

  return mounted;
};
