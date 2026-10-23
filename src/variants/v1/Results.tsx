import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { labelsFor } from '../../lib/matchTaxonomy';
import { MONTHLY_PROPOSAL_LIMIT } from '../../lib/optin';
import { isSent, left, propose as proposePure } from '../logic/proposals';
import { variantRouteId } from '../registry';
import { useFounderDemo } from '../shared/useDemo';
import { rankNumeral, scoreParts } from './editorial';
import { Announcer, Masthead, ScoreLine } from './parts';

function monthDate(key: string): Date {
  const [y, m] = key.split('-').map(Number);
  return new Date(y ?? 2000, (m ?? 1) - 1, 1);
}

export function Results() {
  const { locale, t, f, path } = useI18n();
  const c = t.variants.v1.results;
  const ui = t.match.ui;
  const L = labelsFor(locale);
  const demo = useFounderDemo();
  const [message, setMessage] = useState('');
  const { counter } = demo.proposals;
  const remaining = left(demo.proposals);
  const neutral = t.match.optin.neutralStartup;

  const onPropose = (id: string, name: string) => {
    const next = proposePure(demo.proposals, id, locale);
    demo.propose(id);
    setMessage(next.error ?? ui.startup.proposalSent(name, left(next)));
  };

  return (
    <article className="v1-page v1-results">
      <header className="v1-cover v1-cover-sm">
        <Masthead />
        <p className="v1-kicker">{c.section}</p>
        <h1 id="page-title" tabIndex={-1} className="v1-display v1-display-sm">
          {c.title(demo.matches.length)}
        </h1>
        <p className="v1-standfirst">{c.standfirst}</p>
        <p className="v1-smallcaps">{demo.profileLine}</p>
      </header>

      <aside className="v1-column v1-counter" aria-labelledby="v1-counter-title">
        <h2 id="v1-counter-title" className="v1-smallcaps v1-counter-title">
          {c.counterLabel}
        </h2>
        <p className="v1-counter-figure">
          <span className="v1-counter-num">{ui.counter.used(counter.used, MONTHLY_PROPOSAL_LIMIT)}</span>{' '}
          {ui.counter.usedIn(f.monthName(monthDate(counter.month)))} <span className="v1-provv">({ui.counter.provisional})</span>
        </p>
        <span
          className="v1-score-track"
          role="progressbar"
          aria-label={ui.counter.aria}
          aria-valuemin={0}
          aria-valuemax={MONTHLY_PROPOSAL_LIMIT}
          aria-valuenow={counter.used}
          aria-valuetext={ui.counter.used(counter.used, MONTHLY_PROPOSAL_LIMIT)}
        >
          <span className="v1-score-fill" style={{ width: `${(counter.used / MONTHLY_PROPOSAL_LIMIT) * 100}%` }} />
        </span>
        <p className="v1-note">{remaining > 0 ? ui.counter.left(remaining) : ui.counter.none}</p>
        {demo.proposals.error ? <p className="v1-error">{demo.proposals.error}</p> : null}
      </aside>

      <ol className="v1-articles">
        {demo.matches.map(({ item, evaluation }, i) => {
          const sent = isSent(demo.proposals, item.id);
          return (
            <li key={item.id} className="v1-article">
              <span className="v1-rank" aria-hidden="true">
                {rankNumeral(i + 1)}
              </span>
              <div className="v1-article-body">
                <p className="v1-meta">
                  {L.tipo[item.tipo]}
                  {item.sede ? ui.startup.based(L.regione[item.sede]) : ''}
                </p>
                <h2 className="v1-headline">{item.nome}</h2>
                <p className="v1-standfirst v1-standfirst-sm">{item.tesi}</p>
                <ScoreLine score={evaluation.score} />
                <p className="v1-reasons-label">{ui.reasonsLabel}</p>
                <ul className="v1-prose-list">
                  {evaluation.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
                <p className="v1-parts">
                  <span className="v1-sr">{c.partsLabel}: </span>
                  {scoreParts(evaluation.parts).map((p) => (
                    <span key={p.key} className="v1-part">
                      {c.part(ui.explainer.rows[p.key], p.value, p.max)}
                    </span>
                  ))}
                </p>
                <div className="v1-article-foot">
                  {sent ? (
                    <p className="v1-status">
                      <span className="v1-smallcaps">{c.statusLabel}</span> <strong>{neutral.titolo}.</strong> {neutral.testo}
                    </p>
                  ) : (
                    <button
                      type="button"
                      className="v1-textbtn"
                      onClick={() => onPropose(item.id, item.nome)}
                      aria-disabled={remaining === 0 || undefined}
                    >
                      {t.variants.actions.propose}
                      <span className="v1-sr">{ui.startup.proposeSr(item.nome)}</span> <span aria-hidden="true">→</span>
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {demo.excluded.length > 0 ? (
        <section className="v1-section v1-excluded" aria-labelledby="v1-excluded-title">
          <div className="v1-section-head">
            <h2 id="v1-excluded-title">{ui.excluded.investors(demo.excluded.length)}</h2>
            <p className="v1-section-lead">{c.excludedLead}</p>
          </div>
          <ul className="v1-column v1-excluded-list">
            {demo.excluded.map(({ item, evaluation }) => (
              <li key={item.id}>
                <strong>{item.nome}</strong> <span className="v1-meta-inline">{L.tipo[item.tipo]}</span>
                <span className="v1-whynot">{evaluation.whyNot.join('; ')}.</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="v1-column v1-backlinks">
        <Link className="v1-textlink" to={path(variantRouteId('v1', 'investor'))}>
          {t.variants.v1.landing.ctaInvestor} <span aria-hidden="true">→</span>
        </Link>
      </p>
      <Announcer message={message} />
    </article>
  );
}
