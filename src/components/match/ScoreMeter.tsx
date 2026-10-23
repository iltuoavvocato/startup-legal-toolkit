import { scoreBand } from '../../lib/matching';

export function ScoreMeter({ score }: { score: number }) {
  const band = scoreBand(score);
  return (
    <div className={`mi-score band-${band.band}`}>
      <p className="mi-score-num">
        <span className="mi-score-value">{score}</span>
        <span className="mi-score-max">/100</span>
        <span className="sr-only"> su 100, {band.label.toLowerCase()}</span>
      </p>
      <span className="mi-score-bar" aria-hidden="true">
        <span style={{ width: `${score}%` }} />
      </span>
      <span className="mi-score-label" aria-hidden="true">
        {band.label}
      </span>
    </div>
  );
}
