import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CtaPanel } from '../components/CtaPanel';
import { Disclaimer } from '../components/Disclaimer';
import { PageHero } from '../components/PageHero';
import { Slider } from '../components/Slider';
import { VestingChart } from '../components/VestingChart';
import { readQuery, useSyncQuery } from '../hooks/useQueryState';
import { formatLongDate, formatMonthYear, formatNumber, formatPercent } from '../lib/format';
import {
  DEFAULT_VESTING,
  FREQUENCY_LABELS,
  FREQUENCY_MONTHS,
  MAX_DURATION,
  addMonths,
  leaverOutcome,
  normalizeParams,
  parseISODate,
  toISODate,
  vestingSchedule,
  type Frequency,
  type VestingParams,
} from '../lib/vesting';

type Leaver = 'good' | 'bad';

interface State {
  params: VestingParams;
  start: string;
  leaverMonth: number;
  leaver: Leaver;
}

const today = () => toISODate(new Date());

function initialState(): State {
  return { params: DEFAULT_VESTING, start: today(), leaverMonth: 30, leaver: 'good' };
}

function parseState(q: URLSearchParams): State {
  const base = initialState();
  if (!q.has('d')) return base;
  const freq = q.get('fr') as Frequency | null;
  const params = normalizeParams({
    totalPercent: Number(q.get('q') ?? base.params.totalPercent),
    durationMonths: Number(q.get('d') ?? base.params.durationMonths),
    cliffMonths: Number(q.get('c') ?? base.params.cliffMonths),
    frequency: freq && freq in FREQUENCY_MONTHS ? freq : base.params.frequency,
  });
  const start = parseISODate(q.get('s') ?? '') ? q.get('s')! : base.start;
  const leaverMonth = Math.min(params.durationMonths, Math.max(0, Math.round(Number(q.get('x') ?? 0)) || 0));
  return { params, start, leaverMonth, leaver: q.get('l') === 'bad' ? 'bad' : 'good' };
}

function pluralMonths(n: number): string {
  return `${formatNumber(n)} ${n === 1 ? 'mese' : 'mesi'}`;
}

export function VestingPage() {
  const [state, setState] = useState<State>(() => parseState(readQuery()));
  const { params, leaverMonth, leaver } = state;
  const id = useId();
  const start = parseISODate(state.start) ?? new Date();
  useSyncQuery({
    q: String(params.totalPercent),
    d: String(params.durationMonths),
    c: String(params.cliffMonths),
    fr: params.frequency,
    s: state.start,
    x: String(leaverMonth),
    l: leaver,
  });

  const setParams = (patch: Partial<VestingParams>) =>
    setState((s) => {
      const next = normalizeParams({ ...s.params, ...patch });
      return { ...s, params: next, leaverMonth: Math.min(s.leaverMonth, next.durationMonths) };
    });

  const outcome = leaverOutcome(leaverMonth, params);
  const schedule = useMemo(() => vestingSchedule(params), [params]);
  const period = FREQUENCY_MONTHS[params.frequency];
  const tableRows = schedule.filter(
    (p, i) => i === 0 || p.month === params.cliffMonths || p.month % period === 0 || p.month === params.durationMonths,
  );
  const exitDate = addMonths(start, leaverMonth);
  const pkg = formatPercent(outcome.vestedFraction * 100);
  const vested = formatPercent(outcome.vestedPercent, 2, 0);
  const unvested = formatPercent(outcome.unvestedPercent, 2, 0);

  return (
    <>
      <PageHero eyebrow="Strumento 2 di 3" title={<>Simulatore <em>vesting</em></>}>
        <p>
          Con il vesting le quote di un founder si maturano nel tempo. Imposta durata, cliff e frequenza e scopri cosa
          succede se un socio lascia il progetto in un certo mese.
        </p>
      </PageHero>

      <section className="section section-cream tool-section">
        <div className="container vesting-layout">
          <fieldset className="card vesting-inputs">
            <legend className="card-title">Parametri</legend>
            <Slider
              label="Quote totali del founder"
              value={params.totalPercent}
              min={1}
              max={100}
              step={1}
              onChange={(v) => setParams({ totalPercent: v })}
              display={`${formatPercent(params.totalPercent, 0)} della società`}
            />
            <Slider
              label="Durata del vesting"
              value={params.durationMonths}
              min={6}
              max={MAX_DURATION}
              step={6}
              onChange={(v) => setParams({ durationMonths: v, cliffMonths: Math.min(params.cliffMonths, v) })}
              display={`${pluralMonths(params.durationMonths)}${params.durationMonths % 12 === 0 ? ` (${params.durationMonths / 12} ${params.durationMonths === 12 ? 'anno' : 'anni'})` : ''}`}
            />
            <Slider
              label="Cliff"
              value={params.cliffMonths}
              min={0}
              max={Math.min(params.durationMonths, 36)}
              step={1}
              onChange={(v) => setParams({ cliffMonths: v })}
              display={params.cliffMonths === 0 ? 'nessun cliff' : pluralMonths(params.cliffMonths)}
              hint="Periodo iniziale in cui non matura nulla; alla sua scadenza matura in un colpo solo quanto accumulato."
            />
            <fieldset className="segmented-field">
              <legend>Frequenza di maturazione</legend>
              <div className="segmented">
                {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => (
                  <label key={f} className={params.frequency === f ? 'is-checked' : undefined}>
                    <input
                      type="radio"
                      name={`${id}-freq`}
                      value={f}
                      checked={params.frequency === f}
                      onChange={() => setParams({ frequency: f })}
                    />
                    <span>{FREQUENCY_LABELS[f]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="field">
              <label htmlFor={`${id}-start`}>Data di inizio</label>
              <input
                id={`${id}-start`}
                type="date"
                value={state.start}
                onChange={(e) => setState((s) => ({ ...s, start: parseISODate(e.target.value) ? e.target.value : s.start }))}
              />
            </div>
          </fieldset>

          <div className="vesting-main">
            <section className="card" aria-labelledby={`${id}-chart-title`}>
              <div className="card-head">
                <h2 id={`${id}-chart-title`} className="card-title">
                  Quote maturate nel tempo
                </h2>
                <span className="pill">
                  {pluralMonths(params.durationMonths)} · {FREQUENCY_LABELS[params.frequency].toLowerCase()}
                </span>
              </div>
              <VestingChart
                params={params}
                start={start}
                leaverMonth={leaverMonth}
                onLeaverChange={(m) => setState((s) => ({ ...s, leaverMonth: m }))}
              />
              <Slider
                className="leaver-slider"
                label="Il founder esce al mese"
                value={leaverMonth}
                min={0}
                max={params.durationMonths}
                step={1}
                onChange={(m) => setState((s) => ({ ...s, leaverMonth: m }))}
                display={`${formatNumber(leaverMonth)} · ${formatMonthYear(exitDate)}`}
              />
              <details className="details">
                <summary>Tabella di maturazione</summary>
                <div className="table-scroll">
                  <table className="data-table">
                    <caption className="sr-only">Quote maturate per mese</caption>
                    <thead>
                      <tr>
                        <th scope="col">Mese</th>
                        <th scope="col">Data</th>
                        <th scope="col">Del pacchetto</th>
                        <th scope="col">Della società</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((p) => (
                        <tr key={p.month}>
                          <th scope="row">{p.month}</th>
                          <td>{formatMonthYear(addMonths(start, p.month))}</td>
                          <td>{formatPercent(p.fraction * 100)}</td>
                          <td>{formatPercent(p.percent, 2, 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </section>

            <section className="card leaver-card" aria-labelledby={`${id}-leaver-title`}>
              <h2 id={`${id}-leaver-title`} className="card-title">
                Cosa succede se esce al mese {leaverMonth}
              </h2>
              <p className="leaver-date">Uscita il {formatLongDate(exitDate)}</p>
              <div className="stat-grid" aria-live="polite">
                <div className="stat stat-vested">
                  <span className="stat-label">Quote maturate</span>
                  <strong className="stat-value">{vested}</strong>
                  <span className="stat-sub">{pkg} del suo pacchetto</span>
                </div>
                <div className="stat stat-unvested">
                  <span className="stat-label">Quote non maturate</span>
                  <strong className="stat-value">{unvested}</strong>
                  <span className="stat-sub">{formatPercent(100 - outcome.vestedFraction * 100)} del suo pacchetto</span>
                </div>
              </div>
              <div className="split-bar" aria-hidden="true">
                <span style={{ width: `${outcome.vestedFraction * 100}%` }} />
              </div>

              <fieldset className="segmented-field">
                <legend>Tipo di uscita</legend>
                <div className="segmented segmented-2">
                  {(['good', 'bad'] as Leaver[]).map((l) => (
                    <label key={l} className={leaver === l ? 'is-checked' : undefined}>
                      <input
                        type="radio"
                        name={`${id}-leaver`}
                        value={l}
                        checked={leaver === l}
                        onChange={() => setState((s) => ({ ...s, leaver: l }))}
                      />
                      <span>{l === 'good' ? 'Good leaver' : 'Bad leaver'}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="leaver-explain" aria-live="polite">
                {leaver === 'good' ? (
                  <>
                    <p className="leaver-examples">
                      <strong>Good leaver</strong>: per esempio malattia, licenziamento senza giusta causa, uscita concordata.
                    </p>
                    <p>
                      In genere conserva le quote maturate ({vested} della società). Le quote non maturate ({unvested}) tornano
                      alla società o agli altri soci, di solito con un riacquisto a valore nominale o di mercato, secondo quanto
                      previsto negli accordi.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="leaver-examples">
                      <strong>Bad leaver</strong>: per esempio dimissioni prima di un termine concordato, violazione del
                      patto di non concorrenza, giusta causa.
                    </p>
                    <p>
                      Le quote non maturate ({unvested}) tornano alla società o agli altri soci. In più, gli accordi possono
                      prevedere che perda anche parte o tutte le quote maturate ({vested}), o che debba cederle a un prezzo
                      penalizzante (per esempio al valore nominale).
                    </p>
                  </>
                )}
                <p className="small-note">
                  Queste sono opzioni contrattuali tipiche, non regole di legge: vanno definite nei patti tra fondatori. In una
                  s.r.l. il vesting di solito si realizza con patti parasociali, opzioni call o clausole statutarie.
                </p>
              </div>
              <Disclaimer />
            </section>
          </div>
        </div>
      </section>

      <section className="section section-white">
        <div className="container two-col">
          <div className="example-box">
            <p className="eyebrow eyebrow-dark">Esempio rapido</p>
            <h2>4 anni di vesting, cliff di 1 anno</h2>
            <p>Il founder ha il 25% della società, che matura mese per mese in 48 mesi.</p>
            <ul className="example-list">
              <li>
                <span>Esce a 11 mesi</span>
                <strong>0%</strong>
                <span className="small-note">il cliff non è ancora passato</span>
              </li>
              <li>
                <span>Esce a 12 mesi</span>
                <strong>25%</strong>
                <span className="small-note">del suo pacchetto, cioè il 6,25% della società</span>
              </li>
              <li>
                <span>Esce a 30 mesi</span>
                <strong>62,5%</strong>
                <span className="small-note">del suo pacchetto, cioè il 15,63% della società</span>
              </li>
            </ul>
          </div>
          <div className="prose">
            <h2>Perché il vesting conviene a tutti</h2>
            <p>
              Le quote assegnate al momento della costituzione premiano un lavoro che in gran parte deve ancora essere fatto.
              Con il vesting, chi resta non si trova a dividere la società con chi ha smesso di contribuire, e chi entra sa
              che il suo impegno verrà riconosciuto nel tempo.
            </p>
            <p>
              Gli investitori, di solito, lo guardano con favore: è un segnale che il team ha pensato al proprio futuro. Se
              non avete ancora deciso come dividere le quote, parti dal <Link to="/equity/">calcolatore</Link>.
            </p>
          </div>
        </div>
        <div className="container">
          <CtaPanel
            campaign="vesting"
            title="Vuoi mettere il vesting nero su bianco?"
            text="Un avvocato di ilTuoAvvocato.com può aiutarti a scrivere clausole di vesting e di good/bad leaver adatte alla tua s.r.l."
          />
        </div>
      </section>
    </>
  );
}
