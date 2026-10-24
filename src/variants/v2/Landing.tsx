// V2 Dashboard: landing — dense product overview with KPI tiles, how-it-works and limits tables, live top-3 preview.
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { MONTHLY_PROPOSAL_LIMIT } from '../../lib/optin';
import { labelsFor } from '../../lib/matchTaxonomy';
import { variantRouteId } from '../registry';
import { useFounderDemo, useInvestorDemo } from '../shared/useDemo';
import { avgScore, topScore } from './dash';
import { BandChip, Eyebrow, Kpi, PartsLegend, ScoreCell } from './parts';

export function Landing() {
  const { t, f, locale, path } = useI18n();
  const l = t.variants.v2.landing;
  const ML = t.match.ui.landing;
  const r = t.variants.v2.results;
  const L = labelsFor(locale);
  const founder = useFounderDemo();
  const investor = useInvestorDemo();
  const top3 = founder.matches.slice(0, 3);
  const resultsHref = path(variantRouteId('v2', 'results'));
  const investorHref = path(variantRouteId('v2', 'investor'));

  return (
    <div className="v2-page v2-landing">
      <header className="v2-hero">
        <div className="v2-hero-text">
          <Eyebrow>{l.eyebrow}</Eyebrow>
          <h1 id="page-title" tabIndex={-1} className="v2-h1 v2-h1-xl">
            {l.title}
          </h1>
          <p className="v2-lead">{l.lead}</p>
          <p className="v2-lead v2-lead-sm">{ML.howLead}</p>
          <div className="v2-ctas">
            <Link className="v2-btn v2-btn-primary" to={resultsHref}>
              {l.ctaResults}
              <span aria-hidden="true">→</span>
            </Link>
            <Link className="v2-btn" to={investorHref}>
              {l.ctaInvestor}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <section className="v2-hero-kpis" aria-labelledby="v2-kpi-h">
          <h2 id="v2-kpi-h" className="v2-panel-h">
            {l.kpiTitle}
          </h2>
          <dl className="v2-kpis v2-kpis-grid">
            <Kpi label={l.kpis.directory} value={founder.matches.length + founder.excluded.length} />
            <Kpi label={l.kpis.matches} value={founder.matches.length} />
            <Kpi label={l.kpis.excluded} value={founder.excluded.length} />
            <Kpi label={l.kpis.avg} value={avgScore(founder.matches)} sub="/100" />
            <Kpi label={l.kpis.top} value={topScore(founder.matches)} sub="/100" />
            <Kpi label={l.kpis.startups} value={investor.matches.length} />
            <Kpi label={l.kpis.limit} value={MONTHLY_PROPOSAL_LIMIT}>
              <span className="v2-kpi-note">{t.match.ui.counter.provisional}</span>
            </Kpi>
          </dl>
        </section>
      </header>

      <section className="v2-card" aria-labelledby="v2-prev-h">
        <div className="v2-card-head">
          <div>
            <h2 id="v2-prev-h" className="v2-h2">
              {l.previewTitle}
            </h2>
            <p className="v2-muted v2-small">
              {l.previewLead} {founder.profileLine}
            </p>
          </div>
          <Link className="v2-link" to={resultsHref}>
            {l.previewAll} <span aria-hidden="true">→</span>
          </Link>
        </div>
        <PartsLegend />
        <div className="v2-scroll" tabIndex={0}>
          <table className="v2-table v2-table-preview">
            <thead>
              <tr>
                <th scope="col" className="v2-c-rank">
                  {r.cols.rank}
                </th>
                <th scope="col">{r.cols.nome}</th>
                <th scope="col" className="v2-hide-sm">
                  {r.cols.tipo}
                </th>
                <th scope="col" className="v2-c-num v2-hide-sm">
                  {r.cols.ticket}
                </th>
                <th scope="col" className="v2-c-score">
                  {r.cols.score}
                </th>
                <th scope="col">{r.cols.band}</th>
              </tr>
            </thead>
            <tbody>
              {top3.map((m, i) => (
                <tr key={m.item.id}>
                  <td className="v2-c-rank v2-num">{i + 1}</td>
                  <td className="v2-name">{m.item.nome}</td>
                  <td className="v2-hide-sm">{L.tipo[m.item.tipo]}</td>
                  <td className="v2-c-num v2-num v2-hide-sm">
                    {f.euro(m.item.ticketMin)}–{f.euro(m.item.ticketMax)}
                  </td>
                  <td className="v2-c-score">
                    <ScoreCell evaluation={m.evaluation} />
                  </td>
                  <td>
                    <BandChip score={m.evaluation.score} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="v2-two">
        <section className="v2-card" aria-labelledby="v2-how-h">
          <h2 id="v2-how-h" className="v2-h2">
            {ML.howTitle}
          </h2>
          <div className="v2-scroll" tabIndex={0}>
            <table className="v2-table v2-table-text">
              <thead>
                <tr>
                  <th scope="col" className="v2-c-rank">
                    {l.howHead.step}
                  </th>
                  <th scope="col">{l.howHead.what}</th>
                  <th scope="col">{l.howHead.who}</th>
                </tr>
              </thead>
              <tbody>
                {ML.steps.map((s, i) => (
                  <tr key={s.title}>
                    <td className="v2-c-rank v2-num">
                      <span className="v2-stepno">{i + 1}</span>
                    </td>
                    <td>
                      <strong className="v2-cell-title">{s.title}</strong>
                      <span className="v2-cell-text">{s.text}</span>
                    </td>
                    <td>
                      <span className="v2-tag">{l.who[i]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="v2-card" aria-labelledby="v2-lim-h">
          <h2 id="v2-lim-h" className="v2-h2">
            {t.match.ui.limits.title}
          </h2>
          <div className="v2-scroll" tabIndex={0}>
            <table className="v2-table v2-table-text">
              <thead>
                <tr>
                  <th scope="col">{l.limitsHead.rule}</th>
                  <th scope="col">{l.limitsHead.detail}</th>
                </tr>
              </thead>
              <tbody>
                {t.match.ui.limits.items.map((it) => (
                  <tr key={it.title}>
                    <th scope="row" className="v2-rowhead">
                      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="v2-check">
                        <path d="m2 6.5 2.5 2.5L10 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                      {it.title}
                    </th>
                    <td className="v2-cell-text">{it.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
