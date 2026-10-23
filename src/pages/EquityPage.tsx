import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
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
import { formatEuro, formatNumber, formatPercent } from '../lib/format';
import { MESSAGES } from '../i18n/messages';

const DISCLAIMER = MESSAGES.it.common.disclaimer;

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

function formatFactorValue(id: FactorId, v: number): string {
  if (id === 'capitale') return formatEuro(v);
  if (id === 'tempo') return `${formatNumber(v)}%${v >= 100 ? ' · full-time' : v > 0 ? ' · part-time' : ''}`;
  return `${formatNumber(v)}/10`;
}

export function EquityPage() {
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

  const usedFactors = FACTORS.filter((f) => result.effectiveWeights[f.id] > 0);
  const excludedLabels = FACTORS.filter((f) => result.excludedFactors.includes(f.id)).map((f) => f.label.toLowerCase());

  const summary = () => {
    const lines = ['Ripartizione quote indicativa — Startup Legal Toolkit (ilTuoAvvocato.com)', ''];
    slices.forEach((s) => lines.push(`• ${s.label}: ${formatPercent(s.value)}`));
    lines.push('', 'Pesi dei fattori usati:');
    usedFactors.forEach((f) => lines.push(`• ${f.label}: ${formatPercent(result.effectiveWeights[f.id])}`));
    if (excludedLabels.length) lines.push(`Fattori esclusi (nessun valore inserito): ${excludedLabels.join(', ')}.`);
    lines.push('', 'Valori inseriti:');
    founders.forEach((f, i) =>
      lines.push(`• ${names[i]}: ${FACTORS.map((fac) => `${fac.label.toLowerCase()} ${formatFactorValue(fac.id, f.values[fac.id])}`).join('; ')}`),
    );
    lines.push('', 'Formula: quota_i = Σ_f peso_f × (punteggio_i,f / Σ_j punteggio_j,f)');
    lines.push('', DISCLAIMER);
    return lines.join('\n');
  };

  return (
    <>
      <PageHero eyebrow="Strumento 1 di 3" title={<>Calcolatore <em>ripartizione quote</em></>}>
        <p>
          Dai un peso a ciò che ciascun cofondatore porta nel progetto e ottieni una ripartizione indicativa delle quote.
          Un punto di partenza concreto per parlarne tra soci.
        </p>
      </PageHero>

      <section className="section section-cream tool-section">
        <div className="container tool-layout">
          <div className="tool-inputs">
            <fieldset className="card">
              <legend className="card-title">1. Quanto conta ogni fattore</legend>
              <p className="card-intro">
                Regola l’importanza di ciascun fattore. I pesi vengono normalizzati automaticamente al 100%.
              </p>
              <div className="weights-grid">
                {FACTORS.map((f) => (
                  <Slider
                    key={f.id}
                    label={f.label}
                    value={weights[f.id]}
                    min={0}
                    max={100}
                    step={5}
                    onChange={(v) => setState((s) => ({ ...s, weights: { ...s.weights, [f.id]: v } }))}
                    display={
                      result.excludedFactors.includes(f.id)
                        ? 'escluso'
                        : weightSum > 0
                          ? formatPercent(result.effectiveWeights[f.id])
                          : '—'
                    }
                  />
                ))}
              </div>
            </fieldset>

            <div className="card">
              <div className="card-head">
                <h2 className="card-title">2. Chi porta cosa</h2>
                <span className="pill">
                  {founders.length} {founders.length === 1 ? 'socio' : 'soci'}
                </span>
              </div>
              <p className="card-intro">
                Per idea, competenze e ruolo usa un punteggio da 0 a 10. Tempo e capitale contano in proporzione al
                totale del gruppo.
              </p>
              <ol className="founder-list">
                {founders.map((f, i) => (
                  <li key={i} className="founder-card" style={{ '--founder-color': COLORS[i % COLORS.length] } as CSSProperties}>
                    <div className="founder-head">
                      <span className="founder-dot" aria-hidden="true" />
                      <label className="sr-only" htmlFor={`founder-name-${i}`}>
                        Nome del cofondatore {i + 1}
                      </label>
                      <input
                        id={`founder-name-${i}`}
                        className="founder-name"
                        type="text"
                        value={f.name}
                        maxLength={30}
                        autoComplete="off"
                        onChange={(e) => updateFounder(i, (x) => ({ ...x, name: e.target.value }))}
                      />
                      {founders.length > MIN_FOUNDERS && (
                        <button type="button" className="btn-icon" onClick={() => removeFounder(i)}>
                          <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16">
                            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                          <span className="sr-only">Rimuovi {names[i]}</span>
                        </button>
                      )}
                    </div>
                    <div className="founder-fields">
                      {FACTORS.map((fac) =>
                        fac.kind === 'euro' ? (
                          <div key={fac.id} className="field">
                            <label htmlFor={`cap-${i}`}>{fac.label}</label>
                            <div className="input-affix">
                              <span aria-hidden="true">€</span>
                              <input
                                id={`cap-${i}`}
                                type="number"
                                inputMode="numeric"
                                min={0}
                                step={500}
                                value={f.values.capitale === 0 ? '' : f.values.capitale}
                                placeholder="0"
                                onChange={(e) => setValue(i, 'capitale', Math.min(fac.max, Math.max(0, Number(e.target.value) || 0)))}
                              />
                            </div>
                          </div>
                        ) : (
                          <Slider
                            key={fac.id}
                            label={fac.label}
                            value={f.values[fac.id]}
                            min={0}
                            max={fac.max}
                            step={fac.kind === 'percent' ? 5 : 1}
                            onChange={(v) => setValue(i, fac.id, v)}
                            display={formatFactorValue(fac.id, f.values[fac.id])}
                          />
                        ),
                      )}
                    </div>
                  </li>
                ))}
              </ol>
              {founders.length < MAX_FOUNDERS ? (
                <button type="button" className="btn btn-dashed" onClick={addFounder}>
                  <span aria-hidden="true">+</span> Aggiungi cofondatore
                </button>
              ) : (
                <p className="field-hint">Massimo {MAX_FOUNDERS} cofondatori.</p>
              )}
            </div>

            <div className="card">
              <h2 className="card-title">3. Riserva per pool / ESOP (facoltativa)</h2>
              <p className="card-intro">
                Puoi accantonare una parte delle quote per futuri collaboratori chiave. La riserva riduce in proporzione la
                quota di tutti i fondatori.
              </p>
              <Slider
                label="Riserva pool / ESOP"
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
                Ripartizione indicativa
              </h2>
              <div className="donut-wrap">
                <Donut
                  slices={slices}
                  centerValue={String(founders.length)}
                  centerLabel="cofondatori"
                  ariaLabel={`Grafico a ciambella: ${slices.map((s) => `${s.label} ${formatPercent(s.value)}`).join(', ')}`}
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
                Totale <strong>{formatPercent(100, 1, 1)}</strong>
              </p>
              {result.fallbackEqual && (
                <p className="notice">
                  Non ci sono ancora valori da confrontare: per ora la ripartizione è in parti uguali.
                </p>
              )}
              {!result.fallbackEqual && excludedLabels.length > 0 && (
                <p className="notice">
                  Nessuno ha inserito valori per {excludedLabels.join(', ')}: {excludedLabels.length === 1 ? 'il fattore è escluso' : 'i fattori sono esclusi'} e
                  i pesi degli altri vengono ridistribuiti.
                </p>
              )}
              <Disclaimer />
              <div className="actions no-print">
                <CopyButton label="Copia riepilogo" getText={summary} />
                <button type="button" className="btn btn-outline" onClick={() => window.print()}>
                  Stampa / salva PDF
                </button>
                <button type="button" className="btn btn-text" onClick={() => setState(initialState())}>
                  Ripristina
                </button>
              </div>
            </section>

            <section className="card formula-card" aria-labelledby="formula-title">
              <h2 id="formula-title" className="card-title">
                Come calcoliamo
              </h2>
              <p className="formula" aria-label="quota di i uguale alla somma sui fattori f di peso f per punteggio di i su f diviso la somma dei punteggi di tutti su f">
                quota<sub>i</sub> = Σ<sub>f</sub> peso<sub>f</sub> × (punteggio<sub>i,f</sub> / Σ<sub>j</sub> punteggio<sub>j,f</sub>)
              </p>
              <p>
                Per ogni fattore, ciascuno riceve una parte del peso in proporzione a quanto ha portato rispetto al totale del
                gruppo. I pesi sono normalizzati al 100%. Se per un fattore il totale è zero (per esempio nessuno mette
                capitale), quel fattore viene escluso e i pesi degli altri sono ricalcolati. Le percentuali sono arrotondate
                a un decimale con il metodo dei resti più alti, così il totale fa sempre 100,0%.
              </p>
              <details className="details">
                <summary>Dettaglio per fattore</summary>
                <div className="table-scroll">
                  <table className="data-table">
                    <caption className="sr-only">Contributo di ciascun fattore alla quota di ogni cofondatore, prima della riserva pool</caption>
                    <thead>
                      <tr>
                        <th scope="col">Fattore (peso)</th>
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
                            {fac.label} ({result.effectiveWeights[fac.id] > 0 ? formatPercent(result.effectiveWeights[fac.id]) : 'escluso'})
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
          Risultato <span aria-hidden="true">↓</span>
        </span>
      </a>

      <section className="section section-white">
        <div className="container">
          <div className="section-head">
            <h2>Prima di firmare</h2>
          </div>
          <ul className="note-grid">
            <li>
              <h3>È un punto di partenza</h3>
              <p>
                Il risultato serve ad aprire la discussione, non a chiuderla. Pesi e punteggi sono soggettivi: confrontateli
                apertamente e rivedeteli insieme.
              </p>
            </li>
            <li>
              <h3>Abbinalo al vesting</h3>
              <p>
                Le quote premiano un impegno che in gran parte deve ancora arrivare. Con il vesting maturano un po’ alla volta.{' '}
                <Link to="/vesting/">Prova il simulatore</Link>.
              </p>
            </li>
            <li>
              <h3>Mettilo per iscritto</h3>
              <p>
                La ripartizione concordata, i ruoli e le regole di uscita andrebbero scritti nei patti tra fondatori, adattati
                alla vostra società.
              </p>
            </li>
          </ul>
          <CtaPanel
            campaign="equity"
            title="Vuoi trasformare la ripartizione in un accordo?"
            text="Un avvocato di ilTuoAvvocato.com può aiutarti a scrivere i patti tra fondatori e le clausole di vesting."
          />
        </div>
      </section>
    </>
  );
}
