import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/context';
import { scoreBand, type Ranked } from '../../lib/matching';
import type { Investor as InvestorProfile, StartupProfile } from '../../lib/matchTaxonomy';
import { introEmail, teaserOf } from '../../lib/optin';
import { bucketOf, investorStatus, simulateReply, stateOf, type Board, type InvestorBucket } from '../logic/board';
import { useInvestorDemo } from '../shared/useDemo';
import { pad2 } from './logic';
import { Lock } from './ui';

const BUCKETS: InvestorBucket[] = ['nuovo', 'inviato', 'intro', 'passato'];

interface CardProps {
  m: Ranked<StartupProfile>;
  n: number;
  board: Board;
  investor: InvestorProfile;
  onYes: () => void;
  onNo: () => void;
  onReply: () => void;
}

function Card({ m, n, board, investor, onYes, onNo, onReply }: CardProps) {
  const { t, locale } = useI18n();
  const c = t.variants.v5;
  const x = t.match.ui.teaser;
  const id = m.item.id;
  const teaser = teaserOf(m.item, locale);
  const bucket = bucketOf(board, id);
  const status = investorStatus(board, id, locale);
  const isIntro = stateOf(board, id) === 'intro';
  const band = scoreBand(m.evaluation.score, locale);
  const titleId = `v5-t-${id}`;
  const email = isIntro ? introEmail(m.item, investor, locale) : null;
  const E = t.match.ui.email;
  // After a choice the buttons change: move focus to the new action (or the status) so keyboard users don't lose their place.
  const pending = useRef(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!pending.current) return;
    pending.current = false;
    (actionsRef.current?.querySelector('button') ?? statusRef.current)?.focus();
  }, [bucket]);
  const act = (fn: () => void, changes = true) => () => {
    pending.current = changes;
    fn();
  };

  return (
    <li className={`v5-card is-${bucket}`}>
      <article aria-labelledby={titleId}>
        <div className="v5-card-top">
          <span className="v5-row-idx" aria-hidden="true">
            {pad2(n)}
          </span>
          <h2 id={titleId} className="v5-card-title">
            {isIntro ? (
              <span className="v5-revealed">{t.variants.introReveal(m.item.nome, m.item.founder)}</span>
            ) : (
              <>
                <span className="sr-only">{c.investor.item(n)}: </span>
                <span className="v5-redact" aria-hidden="true" />
                <span className="v5-lock">
                  <Lock />
                  {x.lock}
                </span>
              </>
            )}
          </h2>
          <p className="v5-card-score">
            <span className="v5-row-num">{m.evaluation.score}</span>
            <span className="v5-row-band">{band.label}</span>
          </p>
        </div>

        <p className="v5-card-line">{teaser.oneLiner}</p>
        <dl className="v5-facts v5-facts-4">
          <div>
            <dt>{x.settore}</dt>
            <dd>{teaser.settore}</dd>
          </div>
          <div>
            <dt>{x.fase}</dt>
            <dd>{teaser.fase}</dd>
          </div>
          <div>
            <dt>{x.regione}</dt>
            <dd>{teaser.regione}</dd>
          </div>
          <div>
            <dt>{x.round}</dt>
            <dd>{teaser.importo}</dd>
          </div>
        </dl>

        <details className="v5-why">
          <summary>{c.investor.reasonsToggle}</summary>
          <ul className="v5-reasons">
            {m.evaluation.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </details>

        <div className="v5-card-foot">
          <div className="v5-status" ref={statusRef} tabIndex={-1}>
            <p className="v5-micro">{c.label.status}</p>
            <p className="v5-status-title">{status.titolo}</p>
            <p className="v5-muted v5-small">{status.testo}</p>
            {bucket === 'inviato' && <p className="v5-note">{t.variants.replyNote}</p>}
          </div>
          {bucket === 'nuovo' && (
            <div className="v5-actions" ref={actionsRef}>
              <button type="button" className="v5-btn v5-btn-ghost" onClick={act(onNo)}>
                {t.variants.actions.pass}
              </button>
              <button type="button" className="v5-btn v5-btn-primary" onClick={act(onYes)}>
                {t.variants.actions.interested}
              </button>
            </div>
          )}
          {bucket === 'inviato' && (
            <div className="v5-actions" ref={actionsRef}>
              <button type="button" className="v5-btn v5-btn-ghost" onClick={act(onReply, bucketOf(simulateReply(board, id), id) !== bucket)}>
                {t.variants.actions.simulateReply}
              </button>
            </div>
          )}
        </div>

        {email && (
          <figure className="v5-term" aria-label={E.aria}>
            <div className="v5-term-bar" aria-hidden="true">
              <span />
              <span />
              <span />
              <em>{c.label.terminal}</em>
            </div>
            <dl className="v5-term-head">
              <div>
                <dt>{E.from}</dt>
                <dd>{email.da}</dd>
              </div>
              <div>
                <dt>{E.to}</dt>
                <dd>{email.a.join(', ')}</dd>
              </div>
              <div>
                <dt>{E.subject}</dt>
                <dd>{email.oggetto}</dd>
              </div>
            </dl>
            <div className="v5-term-body">
              {email.corpo.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <figcaption>{E.foot}</figcaption>
          </figure>
        )}
      </article>
    </li>
  );
}

export function Investor() {
  const { t, locale } = useI18n();
  const c = t.variants.v5;
  const demo = useInvestorDemo();
  const [msg, setMsg] = useState('');

  const say = (b: Board, id: string) => {
    const v = investorStatus(b, id, locale);
    setMsg(`${v.titolo}. ${v.testo}`);
  };

  const yes = (id: string) => {
    demo.interested(id);
    say({ ...demo.board, [id]: 'attesa-startup' }, id);
  };
  const no = (id: string) => {
    demo.pass(id);
    say({ ...demo.board, [id]: 'chiusa-investitore' }, id);
  };
  const reply = (id: string) => {
    const next = simulateReply(demo.board, id);
    demo.simulateReply(id);
    const s = stateOf(next, id);
    const m = demo.matches.find((x) => x.item.id === id);
    if (s === 'intro' && m) setMsg(`${t.variants.introReveal(m.item.nome, m.item.founder)}. ${investorStatus(next, id, locale).titolo}.`);
    else say(next, id);
  };
  const reset = () => {
    demo.reset();
    setMsg(c.investor.resetDone);
  };

  return (
    <div className="v5-page v5-inv">
      <header className="v5-head">
        <div className="v5-head-copy">
          <p className="v5-micro">{c.label.product}</p>
          <h1 id="page-title" tabIndex={-1}>
            {c.investor.title}
          </h1>
          <p className="v5-muted">
            <span className="v5-micro v5-inline">{c.label.thesis}</span> {demo.thesisLine}
          </p>
          <p className="v5-muted v5-small">{t.match.ui.investor.anonymousNote}</p>
        </div>
        <div className="v5-counts-wrap">
          <ul className="v5-counts" aria-label={c.investor.countsLabel}>
            {BUCKETS.map((b) => (
              <li key={b} className={`v5-count is-${b}`}>
                <span className="v5-count-num">{pad2(demo.counts[b])}</span>
                <span className="v5-count-label">{t.variants.buckets[b]}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="v5-text-btn" onClick={reset}>
            {c.investor.reset}
          </button>
        </div>
      </header>

      <p className="sr-only" role="status" aria-live="polite">
        {msg}
      </p>

      <ol className="v5-cards" aria-label={c.investor.listLabel}>
        {demo.matches.map((m, i) => (
          <Card
            key={m.item.id}
            m={m}
            n={i + 1}
            board={demo.board}
            investor={demo.investor}
            onYes={() => yes(m.item.id)}
            onNo={() => no(m.item.id)}
            onReply={() => reply(m.item.id)}
          />
        ))}
      </ol>
    </div>
  );
}
