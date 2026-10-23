// V2 Dashboard: shared building blocks (score bars, sortable headers, keyboard legend, roving rows).
import type { ReactNode } from 'react';
import { useI18n } from '../../i18n/context';
import { scoreBand, WEIGHTS, type Evaluation } from '../../lib/matching';
import type { SortState } from '../logic/table';
import { ariaSort, partPoints, PART_KEYS, stackedSegments } from './dash';

export function BandChip({ score }: { score: number }) {
  const { locale } = useI18n();
  const b = scoreBand(score, locale);
  return <span className={`v2-band v2-band-${b.band}`}>{b.label}</span>;
}

/** Score number plus a stacked bar of its four parts (decorative; the number and band carry the meaning). */
export function ScoreCell({ evaluation }: { evaluation: Evaluation }) {
  const { t, locale } = useI18n();
  const band = scoreBand(evaluation.score, locale);
  return (
    <div className="v2-score">
      <span className="v2-score-num" aria-hidden="true">
        {evaluation.score}
      </span>
      <span className="sr-only">{t.variants.v2.common.scoreSr(evaluation.score, band.label)}</span>
      <span className="v2-stack" aria-hidden="true">
        {stackedSegments(evaluation.parts).map((s) => (
          <span key={s.key} className={`v2-seg v2-seg-${s.key}`} style={{ width: `${s.width}%` }} />
        ))}
      </span>
    </div>
  );
}

/** Per-part breakdown (points vs maximum), used in expanded rows. */
export function PartsBreakdown({ evaluation }: { evaluation: Evaluation }) {
  const { t, f } = useI18n();
  const c = t.variants.v2.common;
  const names = t.match.ui.explainer.rows;
  return (
    <div className="v2-parts">
      <p className="v2-detail-h">{c.partsTitle}</p>
      <ul className="v2-parts-list">
        {PART_KEYS.map((k) => {
          const { pts, max } = partPoints(evaluation.parts, k);
          return (
            <li key={k}>
              <span className="v2-parts-name">
                <span className={`v2-dot v2-seg-${k}`} aria-hidden="true" />
                {names[k]}
              </span>
              <span className="v2-parts-bar" aria-hidden="true">
                <span className={`v2-seg-${k}`} style={{ width: `${(pts / max) * 100}%` }} />
              </span>
              <span className="v2-num">{c.partOf(f.number(pts, 1), max)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function PartsLegend() {
  const { t } = useI18n();
  const names = t.match.ui.explainer.rows;
  return (
    <div className="v2-legend">
      <span className="v2-legend-title">{t.variants.v2.common.legend}</span>
      <ul>
        {PART_KEYS.map((k) => (
          <li key={k}>
            <span className={`v2-dot v2-seg-${k}`} aria-hidden="true" />
            {names[k]} <span className="v2-muted v2-num">/{WEIGHTS[k]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface SortThProps<K extends string> {
  label: string;
  col: K;
  sort: SortState<K>;
  onSort: (key: K) => void;
  className?: string;
}

export function SortTh<K extends string>({ label, col, sort, onSort, className }: SortThProps<K>) {
  const { t } = useI18n();
  const active = sort.key === col;
  return (
    <th scope="col" aria-sort={ariaSort(sort, col)} className={className}>
      <button type="button" className="v2-sort" onClick={() => onSort(col)} title={t.variants.v2.common.sortBy(label)}>
        {label}
        <svg className="v2-sort-ico" width="10" height="12" viewBox="0 0 10 12" aria-hidden="true">
          <path d="M5 1 9 5H1z" className={active && sort.dir === 'asc' ? 'on' : ''} />
          <path d="M5 11 1 7h8z" className={active && sort.dir === 'desc' ? 'on' : ''} />
        </svg>
      </button>
    </th>
  );
}

export interface KeyRow {
  keys: string[];
  label: string;
}

export function KeyLegend({ rows }: { rows: KeyRow[] }) {
  const { t } = useI18n();
  return (
    <section className="v2-panel v2-keys" aria-labelledby="v2-keys-h">
      <h2 id="v2-keys-h" className="v2-panel-h">
        {t.variants.v2.common.kbdTitle}
      </h2>
      <dl>
        {rows.map((r) => (
          <div key={r.keys.join()}>
            <dt>
              {r.keys.map((k) => (
                <kbd key={k}>{k}</kbd>
              ))}
            </dt>
            <dd>{r.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Kpi({ label, value, sub, children }: { label: string; value: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="v2-kpi">
      <dt>{label}</dt>
      <dd>
        <span className="v2-kpi-val">{value}</span>
        {sub != null && <span className="v2-kpi-sub">{sub}</span>}
        {children}
      </dd>
    </div>
  );
}

/** Visible status line that doubles as the polite live region. */
export function StatusLine({ message }: { message: string }) {
  return (
    <p className={`v2-status${message ? ' is-on' : ''}`} role="status" aria-live="polite">
      {message}
    </p>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="v2-eyebrow">{children}</p>;
}
