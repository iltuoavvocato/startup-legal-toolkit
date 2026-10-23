import { remaining, type ProposalCounter as Counter } from '../../lib/optin';

const monthName = new Intl.DateTimeFormat('it-IT', { month: 'long' });

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return monthName.format(new Date(y ?? 2000, (m ?? 1) - 1, 1));
}

interface Props {
  counter: Counter;
  limit: number;
}

export function ProposalCounter({ counter, limit }: Props) {
  const left = remaining(counter, limit);
  return (
    <div className="mi-counter">
      <p className="mi-counter-text">
        <strong>
          {counter.used} di {limit}
        </strong>{' '}
        proposte usate a {monthLabel(counter.month)}
        <span className="pill mi-provv">valore provvisorio</span>
      </p>
      <div
        className="progress mi-counter-bar"
        role="progressbar"
        aria-label="Proposte usate questo mese"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={counter.used}
        aria-valuetext={`${counter.used} di ${limit}`}
      >
        <span style={{ width: `${Math.min(100, (counter.used / limit) * 100)}%` }} />
      </div>
      <p className="field-hint">
        {left > 0
          ? `Puoi proporre il tuo profilo ad altri ${left} investitori questo mese.`
          : 'Limite raggiunto: potrai fare nuove proposte il mese prossimo.'}
      </p>
    </div>
  );
}
