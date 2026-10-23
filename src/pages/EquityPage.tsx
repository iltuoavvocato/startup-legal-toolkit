import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { CopyButton } from '../components/CopyButton';
import { CtaPanel } from '../components/CtaPanel';
import { Disclaimer } from '../components/Disclaimer';
import { Donut } from '../components/Donut';
import { PageHero } from '../components/PageHero';
import { Slider } from '../components/Slider';
import { readQuery, useSyncQuery } from '../hooks/useQueryState';
import {
  FACTORS,
  FACTOR_IDS,
  MAX_FOUNDERS,
  MAX_POOL,
  MIN_FOUNDERS,
  calculateEquity,
  defaultFounder,
  defaultWeights,
  type FactorId,
  type FactorValues,
  type Founder,
} from '../lib/equity';
import { useI18n, type I18n } from '../i18n/context';
import { Rich } from '../i18n/Rich';

const COLORS = ['#16305B', '#C9A45C', '#4F6FA8', '#8C6A2E', '#8A97B3'];
const POOL_COLOR = '#D6CDB8';

interface State {
  founders: Founder[];
  weights: FactorValues;
  pool: number;
}

function initialState(): State {
  return { founders: [defaultFounder(0), defaultFounder(1)], weights: defaultWeights(), pool: 0 };
}

const num = (s: string | undefined, fallback: number, max: number) => {
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : fallback;
};

function parseState(q: URLSearchParams): State {
  const base = initialState();
  const f = q.get('f');
  if (!f) return base;
  const founders = f
    .split('|')
    .slice(0, MAX_FOUNDERS)
    .map((chunk, i) => {
      const [name, ...vals] = chunk.split('~');
      const d = defaultFounder(i);
      const values = { ...d.values };
      FACTORS.forEach((fac, k) => (values[fac.id] = num(vals[k], d.values[fac.id], fac.max)));
      return { name: (name ?? '').slice(0, 30) || d.name, values };
    });
  while (founders.length < MIN_FOUNDERS) founders.push(defaultFounder(founders.length));
  const w = (q.get('w') ?? '').split('-');
  const weights = { ...base.weights };
  FACTOR_IDS.forEach((id, k) => (weights[id] = num(w[k], base.weights[id], 100)));
  return { founders, weights, pool: num(q.get('p') ?? undefined, 0, MAX_POOL) };
}

function serialize(s: State): Record<string, string> {
  return {
    f: s.founders.map((f) => [f.name.replace(/[~|]/g, ''), ...FACTOR_IDS.map((id) => f.values[id])].join('~')).join('|'),
    w: FACTOR_IDS.map((id) => s.weights[id]).join('-'),
    p: String(s.pool),
  };
}

function formatFactorValue(f: I18n['f'], id: FactorId, v: number): string {
  if (id === 'capitale') return f.euro(v);
  if (id === 'tempo') return `${f.number(v)}%${v >= 100 ? ' · full-time' : v > 0 ? ' · part-time' : ''}`;
  return `${f.number(v)}/10`;
}

export function EquityPage() {
  const { t, f } = useI18n();
  const e = t.equity;
  const label = (id: FactorId) => e.factors[id];
  const formatPercent = f.percent;
  const [state, setState] = useState<State>(() => parseState(readQuery()));
  const { founders, weights, pool } = state;
  const result = useMemo(() => calculateEquity({ founders, weights, poolPercent: pool }), [founders, weights, pool]);
  useSyncQuery(serialize(state));
  const resultRef = useRef<HTMLElement>(null);
  const [resultVisible, setResultVisible] = useState(false);

  useEffect(() => {
    const el = resultRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setResultVisible(Boolean(entry?.isIntersecting)), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const weightSum = FACTOR_IDS.reduce((s, id) => s + weights[id], 0);
  const names = founders.map((f, i) => f.name.trim() || `Founder ${i + 1}`);

  const updateFounder = (index: number, patch: (f: Founder) => Founder) =>
    setState((s) => ({ ...s, founders: s.founders.map((f, i) => (i === index ? patch(f) : f)) }));
  const setValue = (index: number, id: FactorId, value: number) =>
    updateFounder(index, (f) => ({ ...f, values: { ...f.values, [id]: value } }));
  const addFounder = () =>
    setState((s) => (s.founders.length >= MAX_FOUNDERS ? s : { ...s, founders: [...s.founders, defaultFounder(s.founders.length)] }));
  const removeFounder = (index: number) =>
    setState((s) => (s.founders.length <= MIN_FOUNDERS ? s : { ...s, founders: s.founders.filter((_, i) => i !== index) }));

  const slices = [
    ...names.map((label, i) => ({ label, value: result.display[i] ?? 0, color: COLORS[i % COLORS.length]! })),
    ...(result.poolPercent > 0 ? [{ label: 'Pool / ESOP', value: result.display[founders.length] ?? 0, color: POOL_COLOR }] : []),
  ];

  const usedFactors = FACTORS.filter((fac) => result.effectiveWeights[fac.id] > 0);
  const excludedLabels = FACTORS.filter((fac) => result.excludedFactors.includes(fac.id)).map((fac) => label(fac.id).toLowerCase());

  const summary = () => {
    const lines = [e.summary.heading, ''];
    slices.forEach((s) => lines.push(`• ${s.label}: ${formatPercent(s.value)}`));
    lines.push('', e.summary.weights);
    usedFactors.forEach((fac) => lines.push(`• ${label(fac.id)}: ${formatPercent(result.effectiveWeights[fac.id])}`));
    if (excludedLabels.length) lines.push(e.summary.excluded(excludedLabels.join(', ')));
    lines.push('', e.summary.values);
    founders.forEach((fo, i) =>
      lines.push(
        `• ${names[i]}: ${FACTORS.map((fac) => `${label(fac.id).toLowerCase()} ${formatFactorValue(f, fac.id, fo.values[fac.id])}`).join('; ')}`,
      ),
    );
    lines.push('', e.summary.formula);
    lines.push('', t.common.disclaimer);
    return lines.join('\n');
  };

  return (
    <>
      <PageHero eyebrow={t.common.toolLabel(1, 3)} title={<Rich text={e.title} />}>
        <p>{e.lead}</p>
      </PageHero>

      <section className="section section-cream tool-section">
        <div className="container tool-layout">
          <div className="tool-inputs">
            <fieldset className="card">
              <legend className="card-title">{e.weightsTitle}</legend>
              <p className="card-intro">{e.weightsIntro}</p>
              <div className="weights-grid">
                {FACTORS.map((fac) => (
                  <Slider
                    key={fac.id}
                    label={label(fac.id)}
                    value={weights[fac.id]}
                    min={0}
                    max={100}
                    step={5}
                    onChange={(v) => setState((s) => ({ ...s, weights: { ...s.weights, [fac.id]: v } }))}
                    display={
                      result.excludedFactors.includes(fac.id)
                        ? e.excluded
                        : weightSum > 0
                          ? formatPercent(result.effectiveWeights[fac.id])
                          : '—'
                    }
                  />
                ))}
              </div>
            </fieldset>

            <div className="card">
              <div className="card-head">
                <h2 className="card-title">{e.foundersTitle}</h2>
                <span className="pill">{e.partners(founders.length)}</span>
              </div>
              <p className="card-intro">{e.foundersIntro}</p>
              <ol className="founder-list">
                {founders.map((fo, i) => (
                  <li key={i} className="founder-card" style={{ '--founder-color': COLORS[i % COLORS.length] } as CSSProperties}>
                    <div className="founder-head">
                      <span className="founder-dot" aria-hidden="true" />
                      <label className="sr-only" htmlFor={`founder-name-${i}`}>
                        {e.founderNameLabel(i + 1)}
                      </label>
                      <input
                        id={`founder-name-${i}`}
                        className="founder-name"
                        type="text"
                        value={fo.name}
                        maxLength={30}
                        autoComplete="off"
                        onChange={(e) => updateFounder(i, (x) => ({ ...x, name: e.target.value }))}
                      />
                      {founders.length > MIN_FOUNDERS && (
                        <button type="button" className="btn-icon" onClick={() => removeFounder(i)}>
                          <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16">
                            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                          <span className="sr-only">{e.remove(names[i]!)}</span>
                        </button>
                      )}
                    </div>
                    <div className="founder-fields">
                      {FACTORS.map((fac) =>
                        fac.kind === 'euro' ? (
                          <div key={fac.id} className="field">
                            <label htmlFor={`cap-${i}`}>{label(fac.id)}</label>
                            <div className="input-affix">
                              <span aria-hidden="true">€</span>
                              <input
                                id={`cap-${i}`}
                                type="number"
                                inputMode="numeric"
                                min={0}
                                step={500}
                                value={fo.values.capitale === 0 ? '' : fo.values.capitale}
                                placeholder="0"
                                onChange={(e) => setValue(i, 'capitale', Math.min(fac.max, Math.max(0, Number(e.target.value) || 0)))}
                              />
                            </div>
                          </div>
                        ) : (
                          <Slider
                            key={fac.id}
                            label={label(fac.id)}
                            value={fo.values[fac.id]}
                            min={0}
                            max={fac.max}
                            step={fac.kind === 'percent' ? 5 : 1}
                            onChange={(v) => setValue(i, fac.id, v)}
                            display={formatFactorValue(f, fac.id, fo.values[fac.id])}
                          />
                        ),
                      )}
                    </div>
                  </li>
                ))}
              </ol>
              {founders.length < MAX_FOUNDERS ? (
                <button type="button" className="btn btn-dashed" onClick={addFounder}>
                  <span aria-hidden="true">+</span> {e.addFounder}
                </button>
              ) : (
                <p className="field-hint">{e.maxFounders(MAX_FOUNDERS)}</p>
              )}
            </div>

            <div className="card">
              <h2 className="card-title">{e.poolTitle}</h2>
              <p className="card-intro">{e.poolIntro}</p>
              <Slider
                label={e.poolLabel}
                value={pool}
                min={0}
                max={MAX_POOL}
                step={1}
                onChange={(v) => setState((s) => ({ ...s, pool: v }))}
                display={formatPercent(pool, 0)}
              />
            </div>
          </div>

          <div className="tool-results">
            <section
              ref={resultRef}
              id="risultato"
              className="card result-card"
              aria-labelledby="equity-result-title"
              aria-live="polite"
            >
              <h2 id="equity-result-title" className="card-title">
                {e.resultTitle}
              </h2>
              <div className="donut-wrap">
                <Donut
                  slices={slices}
                  centerValue={String(founders.length)}
                  centerLabel={e.donutCenter}
                  ariaLabel={e.donutAria(slices.map((s) => `${s.label} ${formatPercent(s.value)}`).join(', '))}
                />
              </div>
              <ul className="bar-list">
                {slices.map((s) => (
                  <li key={s.label}>
                    <div className="bar-row">
                      <span className="bar-swatch" style={{ background: s.color }} aria-hidden="true" />
                      <span className="bar-name">{s.label}</span>
                      <strong className="bar-value">{formatPercent(s.value, 1, 1)}</strong>
                    </div>
                    <div className="bar-track" aria-hidden="true">
                      <div className="bar-fill" style={{ width: `${s.value}%`, background: s.color }} />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="total-line">
                {e.total} <strong>{formatPercent(100, 1, 1)}</strong>
              </p>
              {result.fallbackEqual && (
                <p className="notice">{e.fallbackEqual}</p>
              )}
              {!result.fallbackEqual && excludedLabels.length > 0 && (
                <p className="notice">{e.excludedNotice(excludedLabels.join(', '), excludedLabels.length)}</p>
              )}
              <Disclaimer />
              <div className="actions no-print">
                <CopyButton label={e.copySummary} getText={summary} />
                <button type="button" className="btn btn-outline" onClick={() => window.print()}>
                  {e.print}
                </button>
                <button type="button" className="btn btn-text" onClick={() => setState(initialState())}>
                  {e.reset}
                </button>
              </div>
            </section>

            <section className="card formula-card" aria-labelledby="formula-title">
              <h2 id="formula-title" className="card-title">
                {e.formulaTitle}
              </h2>
              <p className="formula" aria-label={e.formulaAria}>
                {e.formulaWords.share}
                <sub>i</sub> = Σ<sub>f</sub> {e.formulaWords.weight}
                <sub>f</sub> × ({e.formulaWords.score}
                <sub>i,f</sub> / Σ<sub>j</sub> {e.formulaWords.score}
                <sub>j,f</sub>)
              </p>
              <p>{e.formulaText}</p>
              <details className="details">
                <summary>{e.breakdown}</summary>
                <div className="table-scroll">
                  <table className="data-table">
                    <caption className="sr-only">{e.breakdownCaption}</caption>
                    <thead>
                      <tr>
                        <th scope="col">{e.breakdownHead}</th>
                        {names.map((n, i) => (
                          <th key={i} scope="col">
                            {n}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {FACTORS.map((fac) => (
                        <tr key={fac.id}>
                          <th scope="row">
                            {label(fac.id)} ({result.effectiveWeights[fac.id] > 0 ? formatPercent(result.effectiveWeights[fac.id]) : e.excluded})
                          </th>
                          {result.breakdown.map((row, i) => (
                            <td key={i}>{formatPercent(row[fac.id])}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </section>
          </div>
        </div>
      </section>

      <a href="#risultato" className={`mobile-summary no-print ${resultVisible ? 'is-hidden' : ''}`} aria-hidden={resultVisible} tabIndex={resultVisible ? -1 : undefined}>
        <span className="mobile-summary-chips">
          {slices.map((s) => (
            <span key={s.label} className="mobile-chip">
              <span className="bar-swatch" style={{ background: s.color }} aria-hidden="true" />
              {formatPercent(s.value)}
            </span>
          ))}
        </span>
        <span className="mobile-summary-link">
          {e.result} <span aria-hidden="true">↓</span>
        </span>
      </a>

      <section className="section section-white">
        <div className="container">
          <div className="section-head">
            <h2>{e.notesTitle}</h2>
          </div>
          <ul className="note-grid">
            {e.notes.map((n) => (
              <li key={n.title}>
                <h3>{n.title}</h3>
                <p>
                  <Rich text={n.text} />
                </p>
              </li>
            ))}
          </ul>
          <CtaPanel campaign="equity" title={e.ctaTitle} text={e.ctaText} />
        </div>
      </section>
    </>
  );
}
