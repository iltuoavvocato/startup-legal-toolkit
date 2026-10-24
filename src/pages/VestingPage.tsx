import { useId, useMemo, useState } from 'react';
import { CtaPanel } from '../components/CtaPanel';
import { Disclaimer } from '../components/Disclaimer';
import { PageHero } from '../components/PageHero';
import { Slider } from '../components/Slider';
import { VestingChart } from '../components/VestingChart';
import { readQuery, useSyncQuery } from '../hooks/useQueryState';
import { useI18n } from '../i18n/context';
import { Rich } from '../i18n/Rich';
import {
  DEFAULT_VESTING,
  FREQUENCY_MONTHS,
  MAX_DURATION,
  addMonths,
  leaverDisplay,
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

export function VestingPage() {
  const { t, f } = useI18n();
  const v = t.vesting;
  const { percent: formatPercent, number: formatNumber, monthYear: formatMonthYear, longDate: formatLongDate } = f;
  const pluralMonths = (n: number) => v.months(formatNumber(n), n);
  const FREQUENCIES = Object.keys(v.frequencies) as Frequency[];
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
  const shown = leaverDisplay(leaverMonth, params);
  const pkg = formatPercent(shown.vestedOfPackage);
  const vested = formatPercent(shown.vested, 2, 0);
  const unvested = formatPercent(shown.unvested, 2, 0);

  return (
    <>
      <PageHero eyebrow={t.common.toolLabel(2, 3)} title={<Rich text={v.title} />}>
        <p>{v.lead}</p>
      </PageHero>

      <section className="section section-cream tool-section">
        <div className="container vesting-layout">
          <fieldset className="card vesting-inputs">
            <legend className="card-title">{v.params}</legend>
            <Slider
              label={v.stake}
              value={params.totalPercent}
              min={1}
              max={100}
              step={1}
              onChange={(v) => setParams({ totalPercent: v })}
              display={v.stakeDisplay(formatPercent(params.totalPercent, 0))}
            />
            <Slider
              label={v.duration}
              value={params.durationMonths}
              min={6}
              max={MAX_DURATION}
              step={6}
              onChange={(v) => setParams({ durationMonths: v, cliffMonths: Math.min(params.cliffMonths, v) })}
              display={`${pluralMonths(params.durationMonths)}${params.durationMonths % 12 === 0 ? ` (${v.years(params.durationMonths / 12)})` : ''}`}
            />
            <Slider
              label={v.cliff}
              value={params.cliffMonths}
              min={0}
              max={Math.min(params.durationMonths, 36)}
              step={1}
              onChange={(v) => setParams({ cliffMonths: v })}
              display={params.cliffMonths === 0 ? v.noCliff : pluralMonths(params.cliffMonths)}
              hint={v.cliffHint}
            />
            <fieldset className="segmented-field">
              <legend>{v.frequency}</legend>
              <div className="segmented">
                {FREQUENCIES.map((fr) => (
                  <label key={fr} className={params.frequency === fr ? 'is-checked' : undefined}>
                    <input
                      type="radio"
                      name={`${id}-freq`}
                      value={fr}
                      checked={params.frequency === fr}
                      onChange={() => setParams({ frequency: fr })}
                    />
                    <span>{v.frequencies[fr]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="field">
              <label htmlFor={`${id}-start`}>{v.startDate}</label>
              <input
                id={`${id}-start`}
                type="date"
                value={state.start}
                aria-describedby={`${id}-start-it`}
                onChange={(e) => setState((s) => ({ ...s, start: parseISODate(e.target.value) ? e.target.value : s.start }))}
              />
              <p id={`${id}-start-it`} className="field-hint date-it">
                {v.startLabel} <strong>{formatLongDate(start)}</strong>
              </p>
            </div>
          </fieldset>

          <div className="vesting-main">
            <section className="card" aria-labelledby={`${id}-chart-title`}>
              <div className="card-head">
                <h2 id={`${id}-chart-title`} className="card-title">
                  {v.chartTitle}
                </h2>
                <span className="pill">
                  {pluralMonths(params.durationMonths)} · {v.frequencies[params.frequency].toLowerCase()}
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
                label={v.leaverSlider}
                value={leaverMonth}
                min={0}
                max={params.durationMonths}
                step={1}
                onChange={(m) => setState((s) => ({ ...s, leaverMonth: m }))}
                display={`${formatNumber(leaverMonth)} · ${formatMonthYear(exitDate)}`}
              />
              <details className="details">
                <summary>{v.table}</summary>
                <div className="table-scroll">
                  <table className="data-table">
                    <caption className="sr-only">{v.tableCaption}</caption>
                    <thead>
                      <tr>
                        <th scope="col">{v.tableHead.month}</th>
                        <th scope="col">{v.tableHead.date}</th>
                        <th scope="col">{v.tableHead.package}</th>
                        <th scope="col">{v.tableHead.company}</th>
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
                {v.leaverTitle(leaverMonth)}
              </h2>
              <p className="leaver-date">{v.exitOn(formatLongDate(exitDate))}</p>
              <div className="stat-grid" aria-live="polite">
                <div className="stat stat-vested">
                  <span className="stat-label">{v.vested}</span>
                  <strong className="stat-value">{vested}</strong>
                  <span className="stat-sub">{v.ofPackage(pkg)}</span>
                </div>
                <div className="stat stat-unvested">
                  <span className="stat-label">{v.unvested}</span>
                  <strong className="stat-value">{unvested}</strong>
                  <span className="stat-sub">{v.ofPackage(formatPercent(shown.unvestedOfPackage))}</span>
                </div>
              </div>
              <p className="stat-total">
                {v.founderTotalBefore} <strong>{formatPercent(shown.total, 2, 0)}</strong> {v.founderTotalAfter}
              </p>
              <div className="split-bar" aria-hidden="true">
                <span style={{ width: `${outcome.vestedFraction * 100}%` }} />
              </div>

              <fieldset className="segmented-field">
                <legend>{v.leaverType}</legend>
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
                      <Rich text={v.goodExamples} />
                    </p>
                    <p>{v.goodText(vested, unvested)}</p>
                  </>
                ) : (
                  <>
                    <p className="leaver-examples">
                      <Rich text={v.badExamples} />
                    </p>
                    <p>{v.badText(vested, unvested)}</p>
                  </>
                )}
                <p className="small-note">{v.leaverNote}</p>
              </div>
              <Disclaimer />
            </section>
          </div>
        </div>
      </section>

      <section className="section section-white">
        <div className="container two-col">
          <div className="example-box">
            <p className="eyebrow eyebrow-dark">{v.exampleEyebrow}</p>
            <h2>{v.exampleTitle}</h2>
            <p>{v.exampleLead}</p>
            <ul className="example-list">
              {v.examples.map((x) => (
                <li key={x.label}>
                  <span>{x.label}</span>
                  <strong>{x.value}</strong>
                  <span className="small-note">{x.note}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="prose">
            <h2>{v.whyTitle}</h2>
            <p>{v.whyText1}</p>
            <p>
              <Rich text={v.whyText2} />
            </p>
          </div>
        </div>
        <div className="container">
          <CtaPanel campaign="vesting" title={v.ctaTitle} text={v.ctaText} />
        </div>
      </section>
    </>
  );
}
