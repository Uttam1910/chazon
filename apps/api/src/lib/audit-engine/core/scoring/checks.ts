import type { CheckOutcome, CheckResult, ScoreKey } from '@chazon/shared';

type SkipOutcome = Extract<CheckOutcome, 'not-applicable' | 'not-checked' | 'inconclusive'>;

/** Classifies a skipped check from its explanation when the caller does not say explicitly. */
export function skipOutcome(detail: string): SkipOutcome {
  if (/not applicable/i.test(detail)) return 'not-applicable';
  if (/could not|failed|unavailable|not available|error|timed out|refused|blocked/i.test(detail)) return 'inconclusive';
  return 'not-checked';
}

/** Builds CheckResults for one custom score. Skipped checks never earn credit. */
export class CheckList {
  readonly items: CheckResult[] = [];
  constructor(private readonly score: ScoreKey) {}

  pass(id: string, label: string, weight: number, detail: string): void {
    this.items.push({ id, label, score: this.score, status: 'pass', weight, credit: 1, detail, outcome: 'pass' });
  }
  fail(id: string, label: string, weight: number, detail: string): void {
    this.items.push({ id, label, score: this.score, status: 'fail', weight, credit: 0, detail, outcome: 'issue' });
  }
  warn(id: string, label: string, weight: number, detail: string, credit = 0.5): void {
    this.items.push({ id, label, score: this.score, status: 'warn', weight, credit, detail, outcome: 'warning' });
  }
  skip(id: string, label: string, weight: number, detail: string, outcome: SkipOutcome = skipOutcome(detail)): void {
    this.items.push({ id, label, score: this.score, status: 'skipped', weight, credit: 0, detail, outcome });
  }
  bool(id: string, label: string, weight: number, ok: boolean, detail: string): void {
    if (ok) this.pass(id, label, weight, detail);
    else this.fail(id, label, weight, detail);
  }
  /** Proportional check across pages: pass at 100 %, warn at >= 50 %, else fail; credit = ratio. */
  ratio(id: string, label: string, weight: number, good: number, total: number, unit = 'pages'): void {
    if (total === 0) {
      this.skip(id, label, weight, `Not applicable: no ${unit} to evaluate.`, 'not-applicable');
      return;
    }
    const r = good / total;
    const detail = `${good} of ${total} ${unit} meet this check.`;
    const status = r === 1 ? 'pass' : r >= 0.5 ? 'warn' : 'fail';
    const item: CheckResult = { id, label, score: this.score, status, weight, credit: r, detail, outcome: status === 'pass' ? 'pass' : status === 'warn' ? 'warning' : 'issue' };
    this.items.push(item);
  }
}
