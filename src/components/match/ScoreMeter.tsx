import { useI18n } from '../../i18n/context';
import { scoreBand } from '../../lib/matching';

export function ScoreMeter({ score }: { score: number }) {
  const { locale, t } = useI18n();
  const band = scoreBand(score, locale);
  return (
    <div className={`mi-score band-${band.band}`}>
      <p className="mi-score-num">
        <span className="mi-score-value">{score}</span>
        <span className="mi-score-max">/100</span>
        <span className="sr-only">{t.match.ui.score.sr(band.label)}</span>
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
