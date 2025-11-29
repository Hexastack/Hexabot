import { SuspensionOptions } from "./context";

/**
 * Error thrown to signal that a workflow suspended at a specific step.
 */
export class WorkflowSuspendedError extends Error {
  public readonly stepId: string;
  public readonly reason?: string;
  public readonly data?: unknown;

  /**
   * Creates an error that captures the step id and the suspension details.
   *
   * @param stepId - Identifier of the step that triggered the suspension.
   * @param options - Optional reason and data sent back to the caller.
   */
  constructor(stepId: string, options?: SuspensionOptions) {
    super(`Workflow suspended at step ${stepId}${options?.reason ? `: ${options.reason}` : ''}`);
    this.stepId = stepId;
    this.reason = options?.reason;
    this.data = options?.data;
  }
}
