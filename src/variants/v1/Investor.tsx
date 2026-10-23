import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { introEmail, teaserOf } from '../../lib/optin';
import { bucketOf, investorStatus, simulateReply as simulatePure, stateOf } from '../logic/board';
import { variantRouteId } from '../registry';
import { useInvestorDemo } from '../shared/useDemo';
import { BUCKETS, canSimulate, rankNumeral } from './editorial';
import { Announcer, Masthead, ScoreLine } from './parts';

export function Investor() {
  const { locale, t, path } = useI18n();
  const c = t.variants.v1.investor;
  const v = t.variants;
  const ui = t.match.ui;
  const demo = useInvestorDemo();
  const [simulated, setSimulated] = useState<ReadonlySet<string>>(() => new Set());
  const [message, setMessage] = useState('');

  const statusMessage = (b: typeof demo.board, id: string) => {
    const s = investorStatus(b, id, locale);
    return `${s.titolo}. ${s.testo}`;
  };

  const onInterested = (id: string) => {
    demo.interested(id);
    setMessage(statusMessage({ ...demo.board, [id]: 'attesa-startup' }, id));
  };
  const onPass = (id: string) => {
    demo.pass(id);
    setMessage(statusMessage({ ...demo.board, [id]: 'chiusa-investitore' }, id));
  };
  const onSimulate = (id: string, nome: string, founder: string) => {
    const next = simulatePure(demo.board, id);
    demo.simulateReply(id);
    setSimulated((s) => new Set(s).add(id));
    setMessage(stateOf(next, id) === 'intro' ? `${statusMessage(next, id)} ${v.introReveal(nome, founder)}` : statusMessage(next, id));
  };
  const onReset = () => {
    demo.reset();
    setSimulated(new Set());
    setMessage(v.actions.restart);
  };

  return (
    <article className="v1-page v1-investor">
      <header className="v1-cover v1-cover-sm">
        <Masthead />
        <p className="v1-kicker">{c.section}</p>
        <h1 id="page-title" tabIndex={-1} className="v1-display v1-display-sm">
          {c.title}
        </h1>
        <p className="v1-standfirst">{c.standfirst}</p>
        <p className="v1-smallcaps">{demo.thesisLine}</p>
      </header>

      <div className="v1-column v1-counts">
        <h2 className="v1-smallcaps v1-counter-title">{c.countsLabel}</h2>
        <ul className="v1-counts-list">
          {BUCKETS.map((b) => (
            <li key={b}>
              <span className="v1-counts-num">{demo.counts[b]}</span> {v.buckets[b]}
            </li>
          ))}
        </ul>
        <p className="v1-note">{ui.investor.anonymousNote}</p>
      </div>

      <ol className="v1-index">
        {demo.matches.map(({ item, evaluation }, i) => {
          const teaser = teaserOf(item, locale);
          const title = ui.investor.startupTitle(teaser.settore, teaser.regione);
          const state = stateOf(demo.board, item.id);
          const status = investorStatus(demo.board, item.id, locale);
          const isIntro = state === 'intro';
          return (
            <li key={item.id} className={`v1-entry v1-entry-${bucketOf(demo.board, item.id)}`}>
              <span className="v1-rank v1-rank-sm" aria-hidden="true">
                {rankNumeral(i + 1)}
              </span>
              <div className="v1-entry-body">
                {isIntro ? (
                  <p className="v1-reveal">{v.introReveal(item.nome, item.founder)}</p>
                ) : (
                  <p className="v1-redacted">
                    <span className="v1-redacted-bar" aria-hidden="true" />
                    <span className="v1-redacted-label">{ui.teaser.lock}</span>
                  </p>
                )}
                <h2 className="v1-headline v1-headline-sm">{title}</h2>
                <p className="v1-smallcaps v1-facts">
                  {ui.teaser.settore} {teaser.settore} · {ui.teaser.fase} {teaser.fase} · {ui.teaser.regione} {teaser.regione} ·{' '}
                  {ui.teaser.round} {teaser.importo}
                </p>
                <p className="v1-oneliner">{teaser.oneLiner}</p>
                <ScoreLine score={evaluation.score} />
                <ul className="v1-prose-list">
                  {evaluation.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
                {state === 'proposta' ? (
                  <p className="v1-inline-actions">
                    <button type="button" className="v1-textbtn v1-textbtn-strong" onClick={() => onInterested(item.id)}>
                      {v.actions.interested}
                      <span className="v1-sr">{c.about(title)}</span>
                    </button>
                    <span className="v1-sep" aria-hidden="true">
                      /
                    </span>
                    <button type="button" className="v1-textbtn" onClick={() => onPass(item.id)}>
                      {v.actions.pass}
                      <span className="v1-sr">{c.about(title)}</span>
                    </button>
                  </p>
                ) : (
                  <div className="v1-statusline">
                    <p className="v1-status">
                      <span className="v1-smallcaps">{c.statusLabel}</span> <strong>{status.titolo}.</strong> {status.testo}
                    </p>
                    {isIntro ? (
                      <p className="v1-note">
                        {c.emailSubject}: <em>{introEmail(item, demo.investor, locale).oggetto}</em>
                      </p>
                    ) : null}
                    {canSimulate(demo.board, item.id, simulated) ? (
                      <button type="button" className="v1-textbtn" onClick={() => onSimulate(item.id, item.nome, item.founder)}>
                        {v.actions.simulateReply}
                        <span className="v1-sr">{c.about(title)}</span>
                      </button>
                    ) : null}
                    {state !== 'chiusa-investitore' && !isIntro ? <p className="v1-note">{v.replyNote}</p> : null}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <p className="v1-column v1-backlinks">
        <button type="button" className="v1-textbtn" onClick={onReset}>
          {v.actions.restart}
        </button>
        <span className="v1-sep" aria-hidden="true">
          ·
        </span>
        <Link className="v1-textlink" to={path(variantRouteId('v1', 'results'))}>
          {t.variants.v1.landing.ctaFounder} <span aria-hidden="true">→</span>
        </Link>
      </p>
      <Announcer message={message} />
    </article>
  );
}
