import type { ReactNode } from 'react';
import type { Evaluation } from '../../lib/matching';
import { ScoreMeter } from './ScoreMeter';

interface Props {
  rank: number;
  title: ReactNode;
  meta: ReactNode;
  evaluation: Evaluation;
  children?: ReactNode;
  actions?: ReactNode;
}

export function MatchCard({ rank, title, meta, evaluation, children, actions }: Props) {
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
      <ul className="mi-reasons" aria-label="Perché è in linea">
        {evaluation.reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      {actions && <div className="mi-match-actions">{actions}</div>}
    </li>
  );
}
