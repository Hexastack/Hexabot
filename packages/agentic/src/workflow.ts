import type { Action } from './action/action.types';
import type { WorkflowContext } from './context';
import { Settings, WorkflowDefinition, WorkflowDefinitionSchema, validateWorkflow } from './dsl.types';
import { WorkflowSuspendedError } from './runtime-error';
import { compileWorkflow } from './workflow-compiler';
import { WorkflowRunner } from './workflow-runner';
import type { CompiledWorkflow, WorkflowRunOptions } from './workflow-types';

export { compileWorkflow } from './workflow-compiler';
export { WorkflowEventEmitter } from './workflow-event-emitter';
export { WorkflowRunner } from './workflow-runner';
export type {
  WorkflowResumeResult,
  WorkflowRunOptions,
  WorkflowStartResult,
} from './workflow-types';

/**
 * Entry point for preparing and executing workflows from YAML or object definitions.
 * Instances are thin wrappers around a compiled workflow graph.
 */
export class Workflow {
  private readonly compiled: CompiledWorkflow;

  private constructor(compiled: CompiledWorkflow) {
    this.compiled = compiled;
  }

  /**
   * Create a workflow from an already parsed definition.
   * The definition is validated before compilation to catch schema issues early.
   */
  static fromDefinition(
    definition: WorkflowDefinition,
    actions: Record<
      string,
      Action<unknown, unknown, WorkflowContext, Settings>
    >,
  ): Workflow {
    const parsed = WorkflowDefinitionSchema.parse(definition);
    const compiled = compileWorkflow(parsed, actions);
    return new Workflow(compiled);
  }

  /**
   * Create a workflow from YAML source.
   * YAML is validated and compiled before being wrapped in a {@link Workflow} instance.
   */
  static fromYaml(
    yaml: string,
    actions: Record<
      string,
      Action<unknown, unknown, WorkflowContext, Settings>
    >,
  ): Workflow {
    const validation = validateWorkflow(yaml);
    if (!validation.success) {
      throw new Error(
        `Workflow validation failed: ${validation.errors.join('; ')}`,
      );
    }

    const compiled = compileWorkflow(validation.data, actions);
    return new Workflow(compiled);
  }

  /**
   * Run the workflow until completion or suspension.
   * Throws {@link WorkflowSuspendedError} when a task suspends so callers can capture the state.
   */
  async run(
    inputData: unknown,
    context: WorkflowContext,
    options?: WorkflowRunOptions,
  ): Promise<Record<string, unknown>> {
    const runner = new WorkflowRunner(this.compiled, options);
    const result = await runner.start({
      inputData,
      context,
      memory: options?.memory,
    });

    if (result.status === 'finished') {
      return result.output;
    }

    if (result.status === 'failed') {
      throw result.error instanceof Error
        ? result.error
        : new Error(String(result.error));
    }

    context.attachWorkflowRuntime(undefined);
    throw new WorkflowSuspendedError(result.step.id, {
      reason: result.reason,
      data: result.data,
    });
  }

  /**
   * Construct a runner without executing, allowing hosts to manage start/resume manually.
   */
  async buildAsyncRunner(
    options?: WorkflowRunOptions,
  ): Promise<WorkflowRunner> {
    return new WorkflowRunner(this.compiled, options);
  }
}
