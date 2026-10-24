import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { Rich } from '../../i18n/Rich';
import { scoreBand } from '../../lib/matching';
import { labelsFor } from '../../lib/matchTaxonomy';
import { variantRouteId } from '../registry';
import { useFounderDemo } from '../shared/useDemo';
import { pad2 } from './logic';
import { PartBars } from './ui';

export function Landing() {
  const { t, locale, path } = useI18n();
  const c = t.variants.v5;
  const L = t.match.ui.landing;
  const demo = useFounderDemo();
  const top = demo.matches[0];
  const tipo = labelsFor(locale).tipo;
  const results = path(variantRouteId('v5', 'results'));
  const investor = path(variantRouteId('v5', 'investor'));
  const limits = [...t.match.ui.limits.items, c.landing.optin];

  return (
    <div className="v5-page v5-land">
      <section className="v5-hero">
        <div className="v5-hero-copy">
          <p className="v5-micro">{c.label.product}</p>
          <h1 id="page-title" tabIndex={-1}>
            {c.landing.title}
          </h1>
          <span className="v5-rule" aria-hidden="true" />
          <p className="v5-lead">{c.landing.lead}</p>
          <div className="v5-ctas">
            <Link className="v5-btn v5-btn-primary" to={results}>
              {c.landing.ctaFounder}
            </Link>
            <Link className="v5-btn v5-btn-ghost" to={investor}>
              {c.landing.ctaInvestor}
            </Link>
          </div>
        </div>

        {top && (
          <section className="v5-readout" aria-labelledby="v5-live-title">
            <p className="v5-micro v5-live">
              <span className="v5-dot" aria-hidden="true" />
              {c.label.live}
            </p>
            <h2 id="v5-live-title" className="v5-readout-title">
              {c.landing.liveTitle}
            </h2>
            <p className="v5-muted v5-small">{demo.profileLine}</p>
            <div className="v5-readout-main">
              <div className="v5-readout-who">
                <p className="v5-micro">{c.label.investor}</p>
                <p className="v5-name">{top.item.nome}</p>
                <p className="v5-muted v5-small">{tipo[top.item.tipo]}</p>
              </div>
              <p className="v5-score-xl">
                <span className="v5-gold">{top.evaluation.score}</span>
                <span className="v5-score-of">/100</span>
                <span className="sr-only">{t.match.ui.score.sr(scoreBand(top.evaluation.score, locale).label)}</span>
                <span className="v5-band" aria-hidden="true">
                  {scoreBand(top.evaluation.score, locale).label}
                </span>
              </p>
            </div>
            <p className="v5-micro">{c.label.parts}</p>
            <PartBars parts={top.evaluation.parts} />
            <p className="v5-micro">{t.match.ui.reasonsLabel}</p>
            <ul className="v5-reasons">
              {top.evaluation.reasons.slice(0, 2).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <Link className="v5-arrow-link" to={results}>
              {c.landing.liveMore(demo.matches.length)}
              <span aria-hidden="true"> →</span>
            </Link>
          </section>
        )}
      </section>

      <section className="v5-spec" aria-labelledby="v5-how">
        <div className="v5-spec-head">
          <p className="v5-micro">{c.label.spec} · A</p>
          <h2 id="v5-how">{c.landing.howTitle}</h2>
          <p className="v5-muted">{L.howLead}</p>
        </div>
        <ol className="v5-spec-rows">
          {L.steps.map((s, i) => (
            <li key={s.title}>
              <span className="v5-spec-key" aria-hidden="true">
                {pad2(i + 1)}
              </span>
              <span className="v5-spec-title">{s.title}</span>
              <span className="v5-spec-text">{s.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="v5-spec" aria-labelledby="v5-limits">
        <div className="v5-spec-head">
          <p className="v5-micro">{c.label.rules} · B</p>
          <h2 id="v5-limits">{c.landing.limitsTitle}</h2>
          <p className="v5-muted">
            <Rich text={t.match.ui.limits.more} />
          </p>
        </div>
        <ul className="v5-spec-rows">
          {limits.map((s, i) => (
            <li key={s.title}>
              <span className="v5-spec-key" aria-hidden="true">
                B{i + 1}
              </span>
              <span className="v5-spec-title">{s.title}</span>
              <span className="v5-spec-text">{s.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="v5-closing" aria-labelledby="v5-closing">
        <h2 id="v5-closing">{c.landing.closingTitle}</h2>
        <p className="v5-muted">{c.landing.closingText}</p>
        <div className="v5-ctas">
          <Link className="v5-btn v5-btn-primary" to={results}>
            {L.ctaStartup}
          </Link>
          <Link className="v5-btn v5-btn-ghost" to={investor}>
            {L.ctaInvestor}
          </Link>
        </div>
      </section>
    </div>
  );
}
