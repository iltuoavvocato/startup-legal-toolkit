import type { ReactNode } from 'react';
import { useI18n } from '../../i18n/context';
import type { Evaluation } from '../../lib/matching';
import { ScoreMeter } from './ScoreMeter';

interface Props {
  rank: number;
  title: ReactNode;
  meta: ReactNode;
  evaluation: Evaluation;
  children?: ReactNode;
  /** Shown under the reasons (e.g. deck signals the agent mentions). */
  footnote?: ReactNode;
  actions?: ReactNode;
}

export function MatchCard({ rank, title, meta, evaluation, children, footnote, actions }: Props) {
  const { t } = useI18n();
  return (
    <li className="mi-match">
      <div className="mi-match-head">
        <span className="mi-rank" aria-hidden="true">
          {rank}
        </span>
        <div className="mi-match-title">
          <h3>
            <span className="sr-only">{rank}. </span>
            {title}
          </h3>
          <p className="mi-match-meta">{meta}</p>
        </div>
        <ScoreMeter score={evaluation.score} />
      </div>
      {children}
      <ul className="mi-reasons" aria-label={t.match.ui.reasonsLabel}>
        {evaluation.reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      {footnote}
      {actions && <div className="mi-match-actions">{actions}</div>}
    </li>
  );
}
