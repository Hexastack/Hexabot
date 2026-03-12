/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z, type ZodIssue } from 'zod';

export type BindingKindSchema = z.ZodTypeAny;

export type BindingKindDescriptor<
  TSchema extends z.ZodTypeAny = BindingKindSchema,
  TMultiple extends boolean = boolean,
> = {
  schema: TSchema;
  multiple: TMultiple;
};

export type BindingKindSchemas = Record<string, BindingKindDescriptor>;

export type InferMountedBindingValue<
  TBindingKind extends BindingKindDescriptor = BindingKindDescriptor,
> = TBindingKind['multiple'] extends true
  ? Record<string, z.infer<TBindingKind['schema']>>
  : TBindingKind['multiple'] extends false
    ? z.infer<TBindingKind['schema']>
    :
        | z.infer<TBindingKind['schema']>
        | Record<string, z.infer<TBindingKind['schema']>>;

export type InferWorkflowBindings<
  TBindingKinds extends BindingKindSchemas = BindingKindSchemas,
> = Partial<{
  [K in keyof TBindingKinds & string]: InferMountedBindingValue<
    TBindingKinds[K]
  >;
}>;

export type DefLike = {
  kind: string;
  description?: string;
  [key: string]: unknown;
};

export type TaskBindingReferences = Record<string, string | string[]>;

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

export type CompiledTaskBindings = Record<string, unknown>;

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
const toBindingRefs = (refs: string | string[]): string[] =>
  Array.isArray(refs) ? refs : [refs];

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
    const kindDefinition = kinds[defDefinition.kind];

    if (!kindDefinition) {
      errors.push(
        `defs.${defName}.kind: Unknown binding kind "${defDefinition.kind}".`,
      );
      continue;
    }

    const { schema } = kindDefinition;
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

    for (const [bindingKind, bindingRefs] of Object.entries(taskBindings)) {
      const kindDefinition = kinds[bindingKind];

      if (!kindDefinition) {
        errors.push(
          `tasks.${taskName}.bindings.${bindingKind}: Unknown binding kind "${bindingKind}".`,
        );
        continue;
      }

      const { multiple } = kindDefinition;
      if (multiple && !Array.isArray(bindingRefs)) {
        errors.push(
          `tasks.${taskName}.bindings.${bindingKind}: Expected an array of def references for binding kind "${bindingKind}".`,
        );
        continue;
      }
      if (!multiple && typeof bindingRefs !== 'string') {
        errors.push(
          `tasks.${taskName}.bindings.${bindingKind}: Expected a single def reference string for binding kind "${bindingKind}".`,
        );
        continue;
      }

      const refs = toBindingRefs(bindingRefs);
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
  bindingKinds?: BindingKindSchemas,
): CompiledTaskBindings => {
  if (!taskBindings) {
    return {};
  }

  const mounted: CompiledTaskBindings = {};
  const kinds = bindingKinds ?? {};

  for (const [bindingKind, bindingRefs] of Object.entries(taskBindings)) {
    const refs = toBindingRefs(bindingRefs);
    const isMultiple =
      kinds[bindingKind]?.multiple ?? Array.isArray(bindingRefs);

    if (!isMultiple) {
      const ref = refs[0];

      if (!ref) {
        continue;
      }

      const resolvedDef = resolvedDefs[ref];

      if (!resolvedDef) {
        continue;
      }

      mounted[bindingKind] = resolvedDef.payload;
      continue;
    }

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
