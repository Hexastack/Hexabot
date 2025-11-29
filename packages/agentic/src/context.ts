export type WorkflowRunStatus = 'idle' | 'running' | 'suspended' | 'finished' | 'failed';

export type ActionStatus = 'pending' | 'running' | 'suspended' | 'completed' | 'failed' | 'skipped';

export interface SuspensionOptions {
  reason?: string;
  data?: unknown;
}

export interface ActionSnapshot {
  id: string;
  name: string;
  status: ActionStatus;
  reason?: string;
}

export interface WorkflowSnapshot {
  status: WorkflowRunStatus;
  actions: Record<string, ActionSnapshot>;
}

export interface WorkflowRuntimeControl {
  readonly status: WorkflowRunStatus;
  readonly resumeData: unknown;
  /**
   * Suspends the currently running action and returns a promise that settles when the workflow resumes.
   *
   * @param options - Optional metadata describing why the suspension occurred.
   * @returns Promise resolved with the data supplied to {@link resume}.
   */
  suspend<T = unknown>(options?: SuspensionOptions): Promise<T>;
  resume(data?: unknown): void;
  getSnapshot(): WorkflowSnapshot;
}

/**
 * Base context that is threaded through every workflow execution.
 *
 * Extend this class in user-land to expose shared services such as loggers,
 * event emitters, database connections, or feature flags.
  */
export abstract class WorkflowContext {
  private _workflowControl?: WorkflowRuntimeControl;

  /**
   * Sets up the context and copies any initial state onto the instance.
   *
   * @param initialState - Optional properties to assign to the context instance.
   */
  protected constructor(initialState?: Record<string, unknown>) {
    if (initialState) {
      Object.assign(this, initialState);
    }
  }

  /**
   * Provides access to the workflow runtime API for the current execution.
   *
   * @returns Runtime control methods that allow suspension and inspection.
   * @throws Error when the context is not currently attached to a runner.
   */
  get workflow(): WorkflowRuntimeControl {
    if (!this._workflowControl) {
      throw new Error('Workflow runtime is not attached to this context.');
    }

    return this._workflowControl;
  }

  /**
   * Attaches or detaches the runtime control object.
   *
   * @param control - Runtime control instance or `undefined` to detach.
   * @returns Nothing; the method mutates internal state.
   */
  attachWorkflowRuntime(control: WorkflowRuntimeControl | undefined): void {
    this._workflowControl = control;
  }
}
