/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import jsonata from 'jsonata';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

export const ExpressionStringSchema = z
  .string()
  .regex(/^=/, 'Expression strings must start with "="')
  .superRefine((value, ctx) => {
    try {
      jsonata(value.slice(1));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown JSONata parse error';
      ctx.addIssue({
        code: 'custom',
        message: `Invalid JSONata expression: ${message}`,
      });
    }
  });

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

// Per-action timeout in milliseconds; 0 disables the timeout wrapper.
export const DEFAULT_TIMEOUT_MS = 0;

// Retry defaults: 3 attempts with exponential backoff starting at 25ms, capped at 10s, no jitter.
export const DEFAULT_RETRY_SETTINGS = {
  max_attempts: 3,
  backoff_ms: 25,
  max_delay_ms: 10_000,
  jitter: 0,
  multiplier: 1,
} as const;

export type InputField = {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: Array<string | number | boolean>;
  items?: InputField;
  properties?: Record<string, InputField>;
};

export type ConditionalBranch =
  | { condition: string; steps: FlowStep[] }
  | { else?: unknown; steps: FlowStep[] };

export type ConditionalBlock = {
  description?: string;
  when: ConditionalBranch[];
};

export type ParallelBlock = {
  description?: string;
  strategy?: 'wait_all' | 'wait_any';
  steps: FlowStep[];
};

export type LoopStep = {
  name?: string;
  description?: string;
  for_each: { item: string; in: string };
  max_concurrency?: number;
  until?: string;
  accumulate?: { as: string; initial: JsonValue; merge: string };
  steps: FlowStep[];
};

export type FlowStep =
  | { do: string }
  | { parallel: ParallelBlock }
  | { conditional: ConditionalBlock }
  | { loop: LoopStep };

export const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ]),
);

const InputFieldSchema: z.ZodType<InputField> = z.lazy(() =>
  z
    .strictObject({
      type: z.enum([
        'string',
        'number',
        'integer',
        'boolean',
        'array',
        'object',
      ]),
      description: z.string().optional(),
      enum: z.array(z.union([z.string(), z.number(), z.boolean()])).optional(),
      items: InputFieldSchema.optional(),
      properties: z.record(z.string(), InputFieldSchema).optional(),
    })
    .superRefine((value, ctx) => {
      if (value.type === 'array' && !value.items) {
        ctx.addIssue({
          code: 'custom',
          message: 'Array inputs must declare "items"',
          path: ['items'],
        });
      }
      if (value.type !== 'array' && value.items) {
        ctx.addIssue({
          code: 'custom',
          message: '"items" is only valid when type is "array"',
          path: ['items'],
        });
      }
      if (value.type !== 'object' && value.properties) {
        ctx.addIssue({
          code: 'custom',
          message: '"properties" is only valid when type is "object"',
          path: ['properties'],
        });
      }
    }),
);
// Retry policy: exponential backoff per attempt, capped by max_delay_ms, with optional jitter multiplier.
const RetriesSchema = z.strictObject({
  max_attempts: z.int().min(1).prefault(DEFAULT_RETRY_SETTINGS.max_attempts),
  backoff_ms: z.int().min(0).prefault(DEFAULT_RETRY_SETTINGS.backoff_ms),
  max_delay_ms: z.int().min(0).prefault(DEFAULT_RETRY_SETTINGS.max_delay_ms),
  jitter: z.number().min(0).prefault(DEFAULT_RETRY_SETTINGS.jitter),
  multiplier: z.number().min(1).prefault(DEFAULT_RETRY_SETTINGS.multiplier),
});

// Execution guardrails applied to every action invocation.
export const SettingsSchema = z
  .strictObject({
    timeout_ms: z.int().nonnegative().prefault(DEFAULT_TIMEOUT_MS),
    retries: RetriesSchema.prefault(() => ({ ...DEFAULT_RETRY_SETTINGS })),
    audit: z.boolean().optional(),
    guardrails: z.strictObject({ mode: z.string() }).optional(),
  })
  .catchall(JsonValueSchema);

export const TaskDefinitionSchema = z.strictObject({
  description: z.string().optional(),
  action: z.string(),
  inputs: z.record(z.string(), JsonValueSchema).optional(),
  outputs: z.record(z.string(), ExpressionStringSchema).optional(),
  settings: SettingsSchema.optional(),
});

const ConditionalWhenSchema: z.ZodType<ConditionalBranch> = z.lazy(() =>
  z.strictObject({
    condition: ExpressionStringSchema,
    steps: z.array(FlowStepSchema),
  }),
);
const ConditionalElseSchema: z.ZodType<ConditionalBranch> = z.lazy(() =>
  z.strictObject({
    else: z.unknown().optional(),
    steps: z.array(FlowStepSchema),
  }),
);
const ConditionalSchema: z.ZodType<{
  description?: string;
  when: ConditionalBranch[];
}> = z.strictObject({
  description: z.string().optional(),
  when: z.array(z.union([ConditionalWhenSchema, ConditionalElseSchema])).min(1),
});
const ParallelSchema: z.ZodType<ParallelBlock> = z.strictObject({
  description: z.string().optional(),
  strategy: z.enum(['wait_all', 'wait_any']).optional(),
  steps: z.array(z.lazy(() => FlowStepSchema)).min(1),
});
const LoopSchema: z.ZodType<LoopStep> = z.lazy(() =>
  z.strictObject({
    name: z.string().optional(),
    description: z.string().optional(),
    for_each: z.strictObject({
      item: z.string(),
      in: ExpressionStringSchema,
    }),
    max_concurrency: z.int().positive().optional(),
    until: ExpressionStringSchema.optional(),
    accumulate: z
      .strictObject({
        as: z.string(),
        initial: JsonValueSchema,
        merge: ExpressionStringSchema,
      })
      .optional(),
    steps: z.array(z.lazy(() => FlowStepSchema)).min(1),
  }),
);

export const FlowStepSchema: z.ZodType<FlowStep> = z.lazy(() =>
  z.union([
    z.strictObject({
      do: z.string(),
    }),
    z.strictObject({
      parallel: ParallelSchema,
    }),
    z.strictObject({
      conditional: ConditionalSchema,
    }),
    z.strictObject({
      loop: LoopSchema,
    }),
  ]),
);

export const WorkflowMetadataSchema = z.strictObject({
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),
});

const InputsSchema = z.strictObject({
  schema: z.record(z.string(), InputFieldSchema).optional(),
});
const DefaultsSchema = z.strictObject({
  settings: SettingsSchema.optional(),
});

export const WorkflowDefinitionSchema = z.strictObject({
  inputs: InputsSchema.optional(),
  context: z.record(z.string(), JsonValueSchema).optional(),
  defaults: DefaultsSchema.optional(),
  tasks: z.record(z.string(), TaskDefinitionSchema),
  flow: z.array(FlowStepSchema),
  outputs: z.record(z.string(), ExpressionStringSchema),
});

export type Settings = z.infer<typeof SettingsSchema>;

export type Conditional = z.infer<typeof ConditionalSchema>;

export type TaskDefinition = z.infer<typeof TaskDefinitionSchema>;

export type TaskDefinitions = z.infer<typeof WorkflowDefinitionSchema>['tasks'];

export type WorkflowMetadata = z.infer<typeof WorkflowMetadataSchema>;

export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;

export type WorkflowValidationResult =
  | { success: true; data: WorkflowDefinition }
  | { success: false; errors: string[] };

const collectTaskReferences = (steps: FlowStep[]): string[] => {
  const refs: string[] = [];

  for (const step of steps) {
    if ('do' in step) {
      refs.push(step.do);
      continue;
    }

    if ('parallel' in step) {
      refs.push(...collectTaskReferences(step.parallel.steps));
      continue;
    }

    if ('conditional' in step) {
      for (const branch of step.conditional.when) {
        if ('condition' in branch) {
          refs.push(...collectTaskReferences(branch.steps));
        } else if ('else' in branch) {
          refs.push(...collectTaskReferences(branch.steps));
        }
      }
      continue;
    }

    if ('loop' in step) {
      refs.push(...collectTaskReferences(step.loop.steps));
    }
  }

  return refs;
};
const formatZodErrors = (issues: z.ZodIssue[]): string[] =>
  issues.map((issue) => {
    const path = issue.path.join('.') || '<root>';

    return `${path}: ${issue.message}`;
  });

export function validateWorkflow(
  input: string | unknown,
): WorkflowValidationResult {
  let candidate: unknown = input;

  if (typeof input === 'string') {
    try {
      candidate = parseYaml(input);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown YAML parse error';

      return {
        success: false,
        errors: ['Unable to parse workflow YAML', message],
      };
    }
  }

  const parsed = WorkflowDefinitionSchema.safeParse(candidate);

  if (!parsed.success) {
    return { success: false, errors: formatZodErrors(parsed.error.issues) };
  }

  const referencedTasks = new Set(collectTaskReferences(parsed.data.flow));
  const missingTasks = Array.from(referencedTasks).filter(
    (task) => !Object.prototype.hasOwnProperty.call(parsed.data.tasks, task),
  );

  if (missingTasks.length > 0) {
    return {
      success: false,
      errors: [
        `Unknown task(s) referenced in flow: ${missingTasks.join(', ')}`,
      ],
    };
  }

  return { success: true, data: parsed.data };
}
