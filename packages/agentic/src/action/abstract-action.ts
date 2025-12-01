import { ZodType, ZodTypeDef } from 'zod';
import { WorkflowContext } from '../context';
import { Settings, SettingsSchema } from '../dsl.types';
import { assertSnakeCaseName } from '../utils/naming';
import { sleep, withTimeout } from '../utils/timeout';
import { ActionExecutionArgs } from './action';
import { Action, ActionMetadata } from './action.types';
import { WorkflowSuspendedError } from '../runtime-error';

/**
 * Base implementation that enforces schema-validated input/output.
 */
export abstract class AbstractAction<
  I,
  O,
  C extends WorkflowContext,
  S extends Settings = Settings,
> implements Action<I, O, C, S>
{
  public readonly name: string;
  public readonly description: string;
  public readonly inputSchema: ZodType<I, ZodTypeDef, unknown>;
  public readonly outputSchema: ZodType<O, ZodTypeDef, unknown>;
  public readonly settingSchema: ZodType<S, ZodTypeDef, unknown>;

  /**
   * Sets up core metadata and schemas for the action.
   *
   * @param metadata - Describes the action name, description, and schemas.
   * @param options - Optional configuration or definition override.
   */
  protected constructor(metadata: ActionMetadata<I, O, S>) {
    assertSnakeCaseName(metadata.name, 'action');
    this.name = metadata.name;
    this.description = metadata.description;
    this.inputSchema = metadata.inputSchema;
    this.outputSchema = metadata.outputSchema;
    this.settingSchema =
      metadata.settingsSchema ??
      (SettingsSchema as ZodType<S, ZodTypeDef, unknown>);
  }

  /**
   * Parses incoming payloads using the input schema.
   *
   * @param payload - Raw input received by the action.
   * @returns Validated input typed as `I`.
   */
  parseInput(payload: unknown): I {
    return this.inputSchema.parse(payload);
  }

  /**
   * Validates and returns the raw action output.
   *
   * @param payload - Raw output produced by {@link execute}.
   * @returns Output typed as `O` after schema validation.
   */
  parseOutput(payload: unknown): O {
    return this.outputSchema.parse(payload);
  }

  /**
   * Executes the action with retry, timeout, and schema safety.
   *
   * @param payload - Raw input being provided to the action.
   * @param context - Workflow context used during execution.
   * @returns Validated output produced by the action.
   * @throws Error when retries are exhausted or validation fails.
   */
  parseSettings(payload: unknown): S {
    const settings = this.settingSchema.parse(payload ?? {});
    return (settings ?? {}) as S;
  }

  async run(payload: unknown, context: C, settings?: Partial<S>): Promise<O> {
    const input = this.parseInput(payload);
    const parsedSettings = this.parseSettings(settings);
    const timeoutMs = parsedSettings.timeout_ms;
    const retrySettings = parsedSettings.retries;

    const maxAttempts = retrySettings.max_attempts;

    let attempt = 0;
    let currentDelay = retrySettings.backoff_ms ?? 0;
    const maxDelayMs = retrySettings.max_delay_ms;
    const jitter = retrySettings.jitter;
    const multiplier = retrySettings.multiplier;

    while (attempt < maxAttempts) {
      try {
        const result = await withTimeout(
          this.execute({ input, context, settings: parsedSettings }),
          timeoutMs,
        );
        return this.parseOutput(result);
      } catch (error) {
        if (error instanceof WorkflowSuspendedError) {
          throw error;
        }

        attempt += 1;

        if (attempt >= maxAttempts) {
          throw error;
        }

        let delay = currentDelay;
        if (maxDelayMs > 0) {
          delay = Math.min(delay, maxDelayMs);
        }

        if (delay > 0) {
          const jitterFactor =
            jitter > 0 ? 1 + (Math.random() * 2 - 1) * jitter : 1;
          const jitteredDelay = Math.max(0, Math.round(delay * jitterFactor));

          if (jitteredDelay > 0) {
            await sleep(jitteredDelay);
          }
        }

        const nextDelay = currentDelay * multiplier;
        currentDelay =
          maxDelayMs > 0 ? Math.min(nextDelay, maxDelayMs) : nextDelay;
      }
    }

    throw new Error('Action failed after exhausting retry attempts.');
  }

  /**
   * Runs the core business logic for the action.
   *
   * @param args - Strongly typed input and context for the action.
   * @returns Action output wrapped in a promise.
   */
  abstract execute(args: ActionExecutionArgs<I, C, S>): Promise<O>;
}
