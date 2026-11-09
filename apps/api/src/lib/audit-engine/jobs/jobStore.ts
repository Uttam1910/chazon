import { randomUUID } from 'node:crypto';
import type { AuditJobStatus, AuditReport, ProgressStep, StepState } from '@chazon/shared';

export interface Job {
  status: AuditJobStatus;
  controller: AbortController;
  finishedAt: number | null;
}

/**
 * In-memory job registry (no database by design). Job IDs are random UUIDs and
 * act as unguessable handles. Finished jobs expire after `ttlMs`.
 */
export class JobStore {
  private readonly jobs = new Map<string, Job>();
  private readonly timer: NodeJS.Timeout;

  constructor(
    private readonly ttlMs = 30 * 60_000,
    private readonly maxJobs = 500,
  ) {
    this.timer = setInterval(() => this.sweep(), 60_000);
    this.timer.unref();
  }

  get running(): number {
    let n = 0;
    for (const j of this.jobs.values()) if (j.status.state === 'running') n++;
    return n;
  }

  create(steps: ProgressStep[]): Job {
    this.sweep();
    if (this.jobs.size >= this.maxJobs) {
      // Drop the oldest finished job to stay bounded.
      for (const [id, j] of this.jobs) {
        if (j.status.state !== 'running') {
          this.jobs.delete(id);
          break;
        }
      }
    }
    const id = randomUUID();
    const job: Job = {
      status: { id, state: 'running', createdAt: new Date().toISOString(), message: 'Audit started', steps },
      controller: new AbortController(),
      finishedAt: null,
    };
    this.jobs.set(id, job);
    return job;
  }

  get(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  updateStep(job: Job, key: string, state: StepState, detail?: string): void {
    const step = job.status.steps.find((s) => s.key === key);
    if (!step) return;
    step.state = state;
    if (detail !== undefined) step.detail = detail.slice(0, 300);
    if (state === 'running') job.status.message = `${step.label}…`;
  }

  complete(job: Job, report: AuditReport): void {
    for (const s of job.status.steps) if (s.state === 'pending' || s.state === 'running') s.state = 'skipped';
    job.status.state = 'completed';
    job.status.message = 'Audit complete';
    job.status.report = report;
    job.finishedAt = Date.now();
  }

  fail(job: Job, code: string, message: string): void {
    for (const s of job.status.steps) if (s.state === 'running' || s.state === 'pending') s.state = s.state === 'running' ? 'failed' : 'skipped';
    job.status.state = 'failed';
    job.status.message = message;
    job.status.error = { code, message };
    job.finishedAt = Date.now();
  }

  sweep(): void {
    const now = Date.now();
    for (const [id, j] of this.jobs) {
      if (j.finishedAt !== null && now - j.finishedAt > this.ttlMs) this.jobs.delete(id);
    }
  }

  close(): void {
    clearInterval(this.timer);
    for (const j of this.jobs.values()) j.controller.abort();
  }
}
