import type {
  SuspensionOptions,
  WorkflowRunStatus,
  WorkflowRuntimeControl,
} from './context';
import { WorkflowSuspendedError } from './runtime-error';
import type { WorkflowRunner } from './workflow-runner';

/** Minimal wrapper that exposes runner controls to actions via the context. */
export class RunnerRuntimeControl implements WorkflowRuntimeControl {
  private readonly runner: WorkflowRunner;

  constructor(runner: WorkflowRunner) {
    this.runner = runner;
  }

  get status(): WorkflowRunStatus {
    return this.runner.getStatus();
  }

  get resumeData(): unknown {
    return this.runner.getLastResumeData();
  }

  suspend<T = unknown>(options?: SuspensionOptions): Promise<T> {
    const currentStep = this.runner.getCurrentStep();
    throw new WorkflowSuspendedError(currentStep?.id ?? 'unknown', options);
  }

  resume(data?: unknown): void {
    void this.runner.resume({ resumeData: data });
  }

  getSnapshot() {
    return this.runner.getSnapshot();
  }
}
