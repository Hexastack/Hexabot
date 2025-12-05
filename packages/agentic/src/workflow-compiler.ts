import type { ZodTypeAny } from 'zod';
import { z } from 'zod';

import type { Action } from './action/action.types';
import type { BaseWorkflowContext } from './context';
import type {
  FlowStep,
  InputField,
  Settings,
  TaskDefinition,
  WorkflowDefinition,
} from './dsl.types';
import { assertSnakeCaseName } from './utils/naming';
import type {
  CompiledMapping,
  CompiledStep,
  CompiledTask,
  CompiledWorkflow,
  ConditionalBranch,
  LoopStep,
  ParallelStep,
} from './workflow-types';
import { compileValue, mergeSettings } from './workflow-values';

/** Build a stable identifier for a step using its path and label. */
const buildStepId = (path: Array<number | string>, label: string): string => {
  const pathPart = path.length > 0 ? path.join('.') : 'root';
  return `${pathPart}:${label}`;
};

/** Convert workflow input field metadata to a zod schema. */
const inputFieldToZod = (field: InputField): ZodTypeAny => {
  let schema: ZodTypeAny;

  switch (field.type) {
    case 'string':
      schema = z.string();
      break;
    case 'number':
      schema = z.number();
      break;
    case 'integer':
      schema = z.number().int();
      break;
    case 'boolean':
      schema = z.boolean();
      break;
    case 'array':
      schema = z.array(field.items ? inputFieldToZod(field.items) : z.any());
      break;
    case 'object': {
      const properties: Record<string, ZodTypeAny> = {};
      if (field.properties) {
        for (const [name, child] of Object.entries(field.properties)) {
          properties[name] = inputFieldToZod(child).optional();
        }
      }
      schema =
        Object.keys(properties).length > 0
          ? z.object(properties).strict().partial()
          : z.record(z.any());
      break;
    }
    default:
      schema = z.any();
  }

  if (field.enum) {
    schema = schema.refine((value) => field.enum?.includes(value), {
      message: `Value must be one of: ${field.enum.join(', ')}`,
    });
  }

  return schema;
};

/** Assemble a parser for the workflow top-level input payload. */
const buildInputParser = (schema?: Record<string, InputField>): ZodTypeAny => {
  if (!schema || Object.keys(schema).length === 0) {
    return z.object({}).passthrough();
  }

  const shape: Record<string, ZodTypeAny> = {};

  for (const [name, field] of Object.entries(schema)) {
    shape[name] = inputFieldToZod(field).optional();
  }

  return z.object(shape).strict().partial();
};

/** Compile a raw mapping object into expression-aware value mappings. */
const compileMapping = (
  values?: Record<string, unknown>,
): CompiledMapping | undefined => {
  if (!values) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, compileValue(value)]),
  );
};

/** Ensure every task references a provided action implementation. */
const assertActionsBound = (
  tasks: Record<string, TaskDefinition>,
  actions: Record<
    string,
    Action<unknown, unknown, BaseWorkflowContext, Settings>
  >,
) => {
  const missing = Object.values(tasks)
    .map((task) => task.action)
    .filter(
      (actionName) =>
        !Object.prototype.hasOwnProperty.call(actions, actionName),
    );

  if (missing.length > 0) {
    throw new Error(
      `No action implementations provided for: ${missing.join(', ')}`,
    );
  }
};

/** Parse settings, compile inputs/outputs, and bind actions for each task. */
const compileTasks = (
  definition: WorkflowDefinition,
  actions: Record<
    string,
    Action<unknown, unknown, BaseWorkflowContext, Settings>
  >,
): Record<string, CompiledTask> => {
  const compiled: Record<string, CompiledTask> = {};
  const defaultSettings = definition.defaults?.settings;

  assertActionsBound(definition.tasks, actions);

  for (const [taskName, task] of Object.entries(definition.tasks)) {
    assertSnakeCaseName(taskName, 'action');

    const action = actions[task.action];
    const settingsPayload = mergeSettings(defaultSettings, task.settings);
    const parsedSettings = action.parseSettings(settingsPayload);

    compiled[taskName] = {
      name: taskName,
      actionName: task.action,
      definition: task,
      action,
      inputs: compileMapping(task.inputs) ?? {},
      outputs: compileMapping(task.outputs) ?? {},
      settings: parsedSettings,
    };
  }

  return compiled;
};

/** Recursively compile flow steps into executable nodes with generated ids. */
const compileFlowSteps = (
  steps: FlowStep[],
  path: Array<number | string> = [],
): CompiledStep[] =>
  steps.map<CompiledStep>((step, index) => {
    const stepPath = [...path, index];

    if ('do' in step) {
      return {
        kind: 'do',
        id: buildStepId(stepPath, `do:${step.do}`),
        stepInfo: {
          id: buildStepId(stepPath, step.do),
          name: step.do,
          type: 'task',
        },
        taskName: step.do,
      };
    }

    if ('parallel' in step) {
      return {
        kind: 'parallel',
        id: buildStepId(stepPath, 'parallel'),
        stepInfo: {
          id: buildStepId(stepPath, 'parallel'),
          name: step.parallel.description ?? 'parallel',
          type: 'parallel',
        },
        description: step.parallel.description,
        strategy: step.parallel.strategy ?? 'wait_all',
        steps: compileFlowSteps(step.parallel.steps, [...stepPath, 'parallel']),
      } as ParallelStep;
    }

    if ('conditional' in step) {
      const branches: ConditionalBranch[] = step.conditional.when.map(
        (branch, branchIdx) => ({
          id: buildStepId([...stepPath, 'branch', branchIdx], 'conditional'),
          condition:
            'condition' in branch ? compileValue(branch.condition) : undefined,
          steps: compileFlowSteps(branch.steps, [
            ...stepPath,
            'branch',
            branchIdx,
          ]),
        }),
      );

      return {
        kind: 'conditional',
        id: buildStepId(stepPath, 'conditional'),
        stepInfo: {
          id: buildStepId(stepPath, 'conditional'),
          name: step.conditional.description ?? 'conditional',
          type: 'conditional',
        },
        description: step.conditional.description,
        branches,
      };
    }

    const loop = step.loop;

    return {
      kind: 'loop',
      id: buildStepId(stepPath, loop.name ?? 'loop'),
      stepInfo: {
        id: buildStepId(stepPath, loop.name ?? 'loop'),
        name: loop.name ?? 'loop',
        type: 'loop',
      },
      name: loop.name,
      description: loop.description,
      forEach: { item: loop.for_each.item, in: compileValue(loop.for_each.in) },
      maxConcurrency: loop.max_concurrency,
      until: loop.until ? compileValue(loop.until) : undefined,
      accumulate: loop.accumulate
        ? {
            as: loop.accumulate.as,
            initial: loop.accumulate.initial,
            merge: compileValue(loop.accumulate.merge),
          }
        : undefined,
      steps: compileFlowSteps(loop.steps, [...stepPath, loop.name ?? 'loop']),
    } as LoopStep;
  });

/** Compile a workflow definition into structures consumable by the runtime. */
export const compileWorkflow = (
  definition: WorkflowDefinition,
  actions: Record<
    string,
    Action<unknown, unknown, BaseWorkflowContext, Settings>
  >,
): CompiledWorkflow => {
  const inputParser = buildInputParser(definition.inputs?.schema);
  const tasks = compileTasks(definition, actions);
  const flow = compileFlowSteps(definition.flow);
  const outputMapping = compileMapping(definition.outputs) ?? {};

  return {
    definition,
    tasks,
    flow,
    outputMapping,
    inputParser,
    defaultSettings: definition.defaults?.settings,
  };
};
