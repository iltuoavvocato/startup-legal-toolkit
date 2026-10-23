import { useI18n } from '../../i18n/context';
import { remaining, type ProposalCounter as Counter } from '../../lib/optin';

function monthDate(key: string): Date {
  const [y, m] = key.split('-').map(Number);
  return new Date(y ?? 2000, (m ?? 1) - 1, 1);
}

interface Props {
  counter: Counter;
  limit: number;
}

export function ProposalCounter({ counter, limit }: Props) {
  const { t, f } = useI18n();
  const c = t.match.ui.counter;
  const left = remaining(counter, limit);
  return (
    <div className="mi-counter">
      <p className="mi-counter-text">
        <strong>{c.used(counter.used, limit)}</strong> {c.usedIn(f.monthName(monthDate(counter.month)))}
        <span className="pill mi-provv">{c.provisional}</span>
      </p>
      <div
        className="progress mi-counter-bar"
        role="progressbar"
        aria-label={c.aria}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={counter.used}
        aria-valuetext={c.used(counter.used, limit)}
      >
        <span style={{ width: `${Math.min(100, (counter.used / limit) * 100)}%` }} />
      </div>
      <p className="field-hint">{left > 0 ? c.left(left) : c.none}</p>
    </div>
  );
}
