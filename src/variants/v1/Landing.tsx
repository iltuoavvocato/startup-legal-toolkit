import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { Rich } from '../../i18n/Rich';
import { labelsFor } from '../../lib/matchTaxonomy';
import { variantRouteId } from '../registry';
import { useFounderDemo } from '../shared/useDemo';
import { rankNumeral } from './editorial';
import { Masthead, ScoreLine } from './parts';

const SECTION_IDS = ['v1-how', 'v1-sample', 'v1-limits'] as const;

export function Landing() {
  const { locale, t, path } = useI18n();
  const c = t.variants.v1.landing;
  const ui = t.match.ui;
  const L = labelsFor(locale);
  const demo = useFounderDemo();
  const top = demo.matches[0];
  const results = path(variantRouteId('v1', 'results'));
  const investor = path(variantRouteId('v1', 'investor'));

  return (
    <article className="v1-page v1-landing">
      <header className="v1-cover">
        <Masthead />
        <p className="v1-kicker">{c.section}</p>
        <h1 id="page-title" tabIndex={-1} className="v1-display">
          <Rich text={c.title} />
        </h1>
        <p className="v1-standfirst">{c.standfirst}</p>
        <p className="v1-byline">{c.byline}</p>
        <nav className="v1-contents" aria-label={t.variants.v1.masthead.contents}>
          <p className="v1-smallcaps">{t.variants.v1.masthead.contents}</p>
          <ol>
            {c.contents.map((label, i) => (
              <li key={label}>
                <a href={`#${SECTION_IDS[i]}`}>
                  <span className="v1-num" aria-hidden="true">
                    {rankNumeral(i + 1)}
                  </span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </header>

      <div className="v1-column v1-lede">
        {c.lede.map((p, i) => (
          <p key={i} className={i === 0 ? 'v1-dropcap' : undefined}>
            {p}
          </p>
        ))}
        <blockquote className="v1-pull">
          <p>{ui.landing.howLead}</p>
        </blockquote>
      </div>

      <section className="v1-section" id={SECTION_IDS[0]} aria-labelledby="v1-how-title">
        <div className="v1-section-head">
          <span className="v1-section-num" aria-hidden="true">
            01
          </span>
          <h2 id="v1-how-title">{ui.landing.howTitle}</h2>
          <p className="v1-section-lead">{c.howLead}</p>
        </div>
        <ol className="v1-steps">
          {ui.landing.steps.map((s, i) => (
            <li key={s.title} className="v1-step">
              <span className="v1-step-num" aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="v1-section" id={SECTION_IDS[1]} aria-labelledby="v1-sample-title">
        <div className="v1-section-head">
          <span className="v1-section-num" aria-hidden="true">
            02
          </span>
          <h2 id="v1-sample-title">{c.contents[1]}</h2>
          <p className="v1-section-lead">{c.sampleLead}</p>
        </div>
        <div className="v1-column">
          <p className="v1-smallcaps">{demo.profileLine}</p>
          {top ? (
            <figure className="v1-sample">
              <p className="v1-kicker">{c.sampleFirst}</p>
              <h3 className="v1-headline">{top.item.nome}</h3>
              <p className="v1-meta">{L.tipo[top.item.tipo]}</p>
              <p className="v1-standfirst v1-standfirst-sm">{top.item.tesi}</p>
              <ScoreLine score={top.evaluation.score} />
              <p className="v1-reasons-label">{ui.reasonsLabel}</p>
              <ul className="v1-prose-list">
                {top.evaluation.reasons.slice(0, 3).map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </figure>
          ) : null}
          <p>
            <Link className="v1-textlink" to={results}>
              {c.sampleMore(demo.matches.length)} <span aria-hidden="true">→</span>
            </Link>
          </p>
        </div>
      </section>

      <section className="v1-section" id={SECTION_IDS[2]} aria-labelledby="v1-limits-title">
        <div className="v1-section-head">
          <span className="v1-section-num" aria-hidden="true">
            03
          </span>
          <h2 id="v1-limits-title">{ui.limits.title}</h2>
          <p className="v1-section-lead">{c.limitsLead}</p>
        </div>
        <dl className="v1-limits">
          {ui.limits.items.map((it) => (
            <div key={it.title} className="v1-limit">
              <dt>{it.title}</dt>
              <dd>{it.text}</dd>
            </div>
          ))}
        </dl>
        <p className="v1-column v1-note">
          <Rich text={ui.limits.more} />
        </p>
      </section>

      <section className="v1-closing" aria-labelledby="v1-closing-title">
        <h2 id="v1-closing-title">{c.closingTitle}</h2>
        <div className="v1-ctas">
          <Link className="v1-cta" to={results}>
            {c.ctaFounder}
          </Link>
          <Link className="v1-textlink" to={investor}>
            {c.ctaInvestor} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </article>
  );
}
