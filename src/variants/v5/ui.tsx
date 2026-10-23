// V5 shared presentational pieces: score breakdown bars, monthly counter, lock icon.
import { useI18n } from '../../i18n/context';
import type { Parts } from '../../lib/matching';
import type { ProposalCounter } from '../../lib/optin';
import { partBars, usedPct } from './logic';

export function PartBars({ parts }: { parts: Parts }) {
  const { t } = useI18n();
  const rows = t.match.ui.explainer.rows;
  return (
    <ul className="v5-bars">
      {partBars(parts).map((b) => (
        <li key={b.key} className="v5-bar">
          <span className="v5-bar-label">{rows[b.key]}</span>
          <span className="v5-bar-num">
            {b.value}/{b.max}
          </span>
          <span className="v5-bar-track" aria-hidden="true">
            <span className="v5-bar-fill" style={{ width: `${b.pct}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function monthDate(key: string): Date {
  const [y, m] = key.split('-').map(Number);
  return new Date(y ?? 2000, (m ?? 1) - 1, 1);
}

export function Counter({ counter, limit, left }: { counter: ProposalCounter; limit: number; left: number }) {
  const { t, f } = useI18n();
  const c = t.match.ui.counter;
  return (
    <div className="v5-counter">
      <p className="v5-counter-row">
        <span className="v5-counter-num">{c.used(counter.used, limit)}</span>
        <span className="v5-counter-text">{c.usedIn(f.monthName(monthDate(counter.month)))}</span>
        <span className="v5-tag">{c.provisional}</span>
      </p>
      <div
        className="v5-counter-track"
        role="progressbar"
        aria-label={c.aria}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={counter.used}
        aria-valuetext={c.used(counter.used, limit)}
      >
        <span style={{ width: `${usedPct(counter.used, limit)}%` }} />
      </div>
      <p className="v5-counter-hint">{left > 0 ? c.left(left) : c.none}</p>
    </div>
  );
}

export function Lock() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </svg>
  );
}
