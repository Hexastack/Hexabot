import type {
  EventEmitterLike,
  WorkflowEventEmitterLike,
} from './workflow-event-emitter';

/**
 * Lifecycle of a workflow run:
 * - idle: runner constructed but `start` not invoked.
 * - running: set when `start` or `resume` begins executing steps.
 * - suspended: an action called `workflow.suspend` (throws WorkflowSuspendedError); `resume` moves back to running.
 * - finished: all steps completed and outputs were evaluated successfully.
 * - failed: an uncaught error bubbled out of a step or continuation.
 */
export type WorkflowRunStatus =
  | 'idle'
  | 'running'
  | 'suspended'
  | 'finished'
  | 'failed';

/**
 * Lifecycle of an individual action/step captured in snapshots:
 * - pending: defined but not yet executed (default before runner touches the step).
 * - running: inputs evaluated and action invoked.
 * - suspended: action raised WorkflowSuspendedError via `workflow.suspend`; resumes to completed.
 * - completed: action resolved (either immediately or after resume).
 * - failed: action threw an error.
 * - skipped: control flow bypassed the step (e.g., alternate branch or wait_any short-circuit).
 */
export type ActionStatus =
  | 'pending'
  | 'running'
  | 'suspended'
  | 'completed'
  | 'failed'
  | 'skipped';

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
export abstract class BaseWorkflowContext<
  S extends Record<string, unknown> = Record<string, unknown>,
  E = EventEmitterLike,
> {
  public state: S;
  private _workflowControl?: WorkflowRuntimeControl;
  private _eventEmitter?: WorkflowEventEmitterLike<E>;

  /**
   * Sets up the context and copies any initial state onto the instance.
   *
   * @param initialState - Optional properties to assign to the context instance.
   * @param eventEmitter - Optional workflow event emitter to expose to actions.
   */
  constructor(initialState?: S, eventEmitter?: WorkflowEventEmitterLike<E>) {
    this.state = (initialState ?? {}) as S;

    if (eventEmitter) {
      this._eventEmitter = eventEmitter;
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
   * Provides access to the workflow event emitter for the current execution.
   * Returns undefined when no emitter was configured.
   */
  get eventEmitter() {
    return this._eventEmitter;
  }

  /**
   * Overrides the workflow event emitter exposed to actions.
   */
  set eventEmitter(emitter: WorkflowEventEmitterLike<E> | undefined) {
    this._eventEmitter = emitter;
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

  /**
   * Attaches or detaches the workflow event emitter.
   *
   * @param emitter - Event emitter instance or `undefined` to detach.
   * @returns Nothing; the method mutates internal state.
   */
  attachEventEmitter(emitter: WorkflowEventEmitterLike<E> | undefined): void {
    this._eventEmitter = emitter;
  }
}
