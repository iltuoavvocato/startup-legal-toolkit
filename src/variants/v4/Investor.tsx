// V4 investor view: a deck of anonymous startup teasers. Interested = send interest (can't be withdrawn),
// Pass = discard (can be undone). The name only appears once the intro is ready; a startup's no looks like pending.
import { useMemo, useState } from 'react';
import { LiveRegion } from '../../components/match/LiveRegion';
import { useI18n } from '../../i18n/context';
import { teaserOf } from '../../lib/optin';
import { bucketCounts, investorStatus, simulateReply, stateOf, type InvestorBucket } from '../logic/board';
import { createDeck, current, decide, isDone, lastDecision, undo, type Decision } from '../logic/deck';
import { useInvestorDemo } from '../shared/useDemo';
import { FocusHeading, TeaserDeckCard } from './cards';
import { SwipeDeck } from './SwipeDeck';
import { BUCKET_ORDER, groupByBucket, undoAllowed, undoLocked } from './swipe';

export function Investor() {
  const { locale, t } = useI18n();
  const v = t.variants;
  const x = v.v4.investor;
  const demo = useInvestorDemo();
  const { matches, board } = demo;
  const ids = useMemo(() => matches.map((m) => m.item.id), [matches]);
  const byId = useMemo(() => new Map(matches.map((m) => [m.item.id, m])), [matches]);
  const [deck, setDeck] = useState(() => createDeck(ids));
  const [message, setMessage] = useState('');
  const counts = bucketCounts(board, ids);
  const groups = groupByBucket(board, ids);

  const titleOf = (id: string) => {
    const m = byId.get(id);
    if (!m) return '';
    const teaser = teaserOf(m.item, locale);
    return t.match.ui.investor.startupTitle(teaser.settore, teaser.regione);
  };
  /** Name and founder, only once both sides said yes. */
  const revealOf = (id: string) => {
    const m = byId.get(id);
    return m && stateOf(board, id) === 'intro' ? v.introReveal(m.item.nome, m.item.founder) : null;
  };

  const onDecide = (d: Decision) => {
    const id = current(deck);
    if (!id) return;
    const next = decide(deck, d);
    if (d === 'interested') {
      demo.interested(id);
      setMessage(`${t.match.optin.waitingInvestor.titolo}: ${titleOf(id)}.`);
    } else {
      demo.pass(id);
      setMessage(`${titleOf(id)}. ${v.passNote}`);
    }
    setDeck(next);
    if (isDone(next)) setMessage((m) => `${m} ${v.v4.deck.doneAnnounce}`);
  };
  const onUndo = () => {
    const last = lastDecision(deck);
    if (!last || last.decision !== 'pass') return;
    demo.send(last.id, 'RESET');
    setDeck(undo(deck));
    setMessage(v.v4.deck.undone(titleOf(last.id)));
  };
  const onSimulate = (id: string) => {
    const nextBoard = simulateReply(board, id);
    demo.simulateReply(id);
    const m = byId.get(id);
    if (m && stateOf(nextBoard, id) === 'intro') setMessage(x.introAnnounce(v.introReveal(m.item.nome, m.item.founder)));
    else setMessage(x.replyPending(investorStatus(nextBoard, id, locale).titolo));
  };
  const restart = () => {
    demo.reset();
    setDeck(createDeck(ids));
    setMessage(x.restarted);
  };

  const renderItem = (id: string, bucket: InvestorBucket) => {
    const status = investorStatus(board, id, locale);
    const reveal = revealOf(id);
    return (
      <li key={id} className={`v4-item v4-item-${bucket}`}>
        <p className="v4-list-name">{reveal ?? titleOf(id)}</p>
        {bucket !== 'nuovo' && <p className="v4-item-status">{status.titolo}</p>}
        {bucket === 'inviato' && (
          <button type="button" className="v4-btn v4-btn-small" onClick={() => onSimulate(id)}>
            {v.actions.simulateReply}
          </button>
        )}
      </li>
    );
  };

  return (
    <div className="v4-page v4-investor">
      <header className="v4-head">
        <p className="v4-eyebrow">{x.eyebrow}</p>
        <h1 id="page-title" tabIndex={-1}>
          {t.match.ui.investor.resultsTitle(matches.length)}
        </h1>
        <p className="v4-lead">{x.lead}</p>
        <p className="v4-profile">{demo.thesisLine}</p>
        <p className="v4-anon">{t.match.ui.investor.anonymousNote}</p>
      </header>

      <div className="v4-layout">
        <section className="v4-main" aria-labelledby="page-title">
          <SwipeDeck
            deck={deck}
            renderCard={(id) => {
              const m = byId.get(id);
              return m ? <TeaserDeckCard startup={m.item} evaluation={m.evaluation} /> : null;
            }}
            onDecide={onDecide}
            onUndo={onUndo}
            canUndo={undoAllowed(deck)}
            undoLockedNote={undoLocked(deck) ? x.undoLocked : null}
            done={
              <div className="v4-done-card">
                <span className="v4-done-icon" aria-hidden="true">
                  ✓
                </span>
                <FocusHeading className="v4-done-title">{x.doneTitle}</FocusHeading>
                <p>{x.doneText}</p>
                <button type="button" className="v4-btn v4-btn-ghost" onClick={restart}>
                  {v.actions.restart}
                </button>
              </div>
            }
          />
        </section>

        <aside className="v4-side">
          <section className="v4-panel" aria-labelledby="v4-choices">
            <h2 id="v4-choices" className="v4-panel-title">
              {x.summaryTitle}
            </h2>
            <ul className="v4-counts">
              {BUCKET_ORDER.map((b) => (
                <li key={b} className={`v4-count v4-count-${b}`}>
                  <span className="v4-count-n">{counts[b]}</span>
                  <span className="v4-count-label">{v.buckets[b]}</span>
                </li>
              ))}
            </ul>
            {BUCKET_ORDER.filter((b) => b !== 'nuovo').map((b) => (
              <div key={b} className="v4-group">
                <h3 className="v4-group-title">
                  <span className={`v4-dot v4-dot-${b}`} aria-hidden="true" />
                  {v.buckets[b]} ({counts[b]})
                </h3>
                {groups[b].length === 0 ? (
                  <p className="v4-empty">{x.noneInBucket}</p>
                ) : (
                  <ul className="v4-list v4-list-items">{groups[b].map((id) => renderItem(id, b))}</ul>
                )}
                {b === 'inviato' && groups[b].length > 0 && <p className="v4-note">{v.replyNote}</p>}
                {b === 'passato' && groups[b].length > 0 && <p className="v4-note">{v.passNote}</p>}
              </div>
            ))}
          </section>
        </aside>
      </div>
      <LiveRegion message={message} />
    </div>
  );
}
