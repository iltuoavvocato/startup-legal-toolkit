// V1 "Editoriale": small presentational pieces shared by the three screens.
import { useI18n } from '../../i18n/context';
import { scoreBand } from '../../lib/matching';
import { barPercent } from './editorial';

/** Magazine masthead: brand, issue number, edition line. */
export function Masthead() {
  const { t } = useI18n();
  const m = t.variants.v1.masthead;
  return (
    <div className="v1-masthead">
      <span className="v1-brand">MatchInvStar</span>
      <span className="v1-masthead-meta">
        {m.issue} · {m.edition}
      </span>
    </div>
  );
}

/** "86/100 · Molto affine" with a thin gold rule underneath. */
export function ScoreLine({ score }: { score: number }) {
  const { locale, t } = useI18n();
  const band = scoreBand(score, locale);
  return (
    <div className="v1-score">
      <p className="v1-score-text">{t.variants.v1.results.score(score, band.label)}</p>
      <span className="v1-score-track" aria-hidden="true">
        <span className="v1-score-fill" style={{ width: `${barPercent(score)}%` }} />
      </span>
    </div>
  );
}

/** Polite live region (visually hidden). */
export function Announcer({ message }: { message: string }) {
  return (
    <p className="v1-sr" role="status" aria-live="polite">
      {message}
    </p>
  );
}
