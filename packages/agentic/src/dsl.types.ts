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
      const message = error instanceof Error ? error.message : 'Unknown JSONata parse error';
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
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
  | { conditional: { description?: string; when: ConditionalBranch[] } }
  | { loop: LoopStep };

export const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(JsonValueSchema),
  ]),
);

const InputFieldSchema: z.ZodType<InputField> = z.lazy(() =>
  z
    .object({
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
      properties: z.record(InputFieldSchema).optional(),
    })
    .strict()
    .superRefine((value, ctx) => {
      if (value.type === 'array' && !value.items) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Array inputs must declare "items"',
          path: ['items'],
        });
      }
      if (value.type !== 'array' && value.items) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '"items" is only valid when type is "array"',
          path: ['items'],
        });
      }
      if (value.type !== 'object' && value.properties) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '"properties" is only valid when type is "object"',
          path: ['properties'],
        });
      }
    }),
);

// Retry policy: exponential backoff per attempt, capped by max_delay_ms, with optional jitter multiplier.
const RetriesSchema = z
  .object({
    max_attempts: z
      .number()
      .int()
      .min(1)
      .default(DEFAULT_RETRY_SETTINGS.max_attempts),
    backoff_ms: z
      .number()
      .int()
      .min(0)
      .default(DEFAULT_RETRY_SETTINGS.backoff_ms),
    max_delay_ms: z
      .number()
      .int()
      .min(0)
      .default(DEFAULT_RETRY_SETTINGS.max_delay_ms),
    jitter: z
      .number()
      .min(0)
      .default(DEFAULT_RETRY_SETTINGS.jitter),
    multiplier: z
      .number()
      .min(1)
      .default(DEFAULT_RETRY_SETTINGS.multiplier),
  })
  .strict();

// Execution guardrails applied to every action invocation.
export const SettingsSchema = z
  .object({
    timeout_ms: z.number().int().nonnegative().default(DEFAULT_TIMEOUT_MS),
    retries: RetriesSchema.default(() => ({ ...DEFAULT_RETRY_SETTINGS })),
    audit: z.boolean().optional(),
    guardrails: z.object({ mode: z.string() }).optional(),
  })
  .catchall(JsonValueSchema)
  .strict();

export const TaskDefinitionSchema = z
  .object({
    description: z.string().optional(),
    action: z.string(),
    inputs: z.record(JsonValueSchema).optional(),
    outputs: z.record(ExpressionStringSchema).optional(),
    settings: SettingsSchema.optional(),
  })
  .strict();

const ConditionalWhenSchema: z.ZodType<ConditionalBranch> = z.lazy(() =>
  z
    .object({
      condition: ExpressionStringSchema,
      steps: z.array(FlowStepSchema),
    })
    .strict(),
);

const ConditionalElseSchema: z.ZodType<ConditionalBranch> = z.lazy(() =>
  z
    .object({
      else: z.unknown().optional(),
      steps: z.array(FlowStepSchema),
    })
    .strict(),
);

const ConditionalSchema: z.ZodType<{ description?: string; when: ConditionalBranch[] }> = z
  .object({
    description: z.string().optional(),
    when: z.array(z.union([ConditionalWhenSchema, ConditionalElseSchema])).min(1),
  })
  .strict();

const ParallelSchema: z.ZodType<ParallelBlock> = z
  .object({
    description: z.string().optional(),
    strategy: z.enum(['wait_all', 'wait_any']).optional(),
    steps: z.array(z.lazy(() => FlowStepSchema)).min(1),
  })
  .strict();

const LoopSchema: z.ZodType<LoopStep> = z.lazy(() =>
  z
    .object({
      name: z.string().optional(),
      description: z.string().optional(),
      for_each: z
        .object({
          item: z.string(),
          in: ExpressionStringSchema,
        })
        .strict(),
      max_concurrency: z.number().int().positive().optional(),
      until: ExpressionStringSchema.optional(),
      accumulate: z
        .object({
          as: z.string(),
          initial: JsonValueSchema,
          merge: ExpressionStringSchema,
        })
        .strict()
        .optional(),
      steps: z.array(z.lazy(() => FlowStepSchema)).min(1),
    })
    .strict(),
);

export const FlowStepSchema: z.ZodType<FlowStep> = z.lazy(() =>
  z.union([
    z
      .object({
        do: z.string(),
      })
      .strict(),
    z
      .object({
        parallel: ParallelSchema,
      })
      .strict(),
    z
      .object({
        conditional: ConditionalSchema,
      })
      .strict(),
    z
      .object({
        loop: LoopSchema,
      })
      .strict(),
  ]),
);

export const WorkflowMetadataSchema = z
  .object({
    name: z.string().min(1),
    version: z.string().min(1),
    description: z.string().optional(),
  })
  .strict();

const InputsSchema = z
  .object({
    schema: z.record(InputFieldSchema).optional(),
  })
  .strict();

const DefaultsSchema = z
  .object({
    settings: SettingsSchema.optional(),
  })
  .strict();

export const WorkflowDefinitionSchema = z
  .object({
    workflow: WorkflowMetadataSchema,
    inputs: InputsSchema.optional(),
    context: z.record(JsonValueSchema).optional(),
    memory: z.record(JsonValueSchema).optional(),
    defaults: DefaultsSchema.optional(),
    tasks: z
      .record(TaskDefinitionSchema)
      .superRefine((value, ctx) => {
        if (Object.keys(value).length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'At least one task must be declared',
          });
        }
      }),
    flow: z.array(FlowStepSchema).min(1, 'Flow must contain at least one step'),
    outputs: z
      .record(ExpressionStringSchema)
      .refine((value) => Object.keys(value).length > 0, {
        message: 'At least one output must be declared',
      }),
  })
  .strict();

export type Settings = z.infer<typeof SettingsSchema>;
export type TaskDefinition = z.infer<typeof TaskDefinitionSchema>;
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

export function validateWorkflow(input: string | unknown): WorkflowValidationResult {
  let candidate: unknown = input;

  if (typeof input === 'string') {
    try {
      candidate = parseYaml(input);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown YAML parse error';
      return { success: false, errors: ['Unable to parse workflow YAML', message] };
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
      errors: [`Unknown task(s) referenced in flow: ${missingTasks.join(', ')}`],
    };
  }

  return { success: true, data: parsed.data };
}
