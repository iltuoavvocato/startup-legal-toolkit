// V4 founder results: a deck of investor matches. Interested = propose the profile (monthly limit), Pass = skip.
import { useMemo, useState } from 'react';
import { LiveRegion } from '../../components/match/LiveRegion';
import { useI18n } from '../../i18n/context';
import { labelsFor } from '../../lib/matchTaxonomy';
import { MONTHLY_PROPOSAL_LIMIT } from '../../lib/optin';
import { createDeck, current, decide, decided, isDone, lastDecision, undo, type Decision } from '../logic/deck';
import { isSent, left } from '../logic/proposals';
import { useFounderDemo } from '../shared/useDemo';
import { FocusHeading, InvestorCard } from './cards';
import { SwipeDeck } from './SwipeDeck';
import { undoAllowed, undoLocked } from './swipe';

function Counter({ used }: { used: number }) {
  const { t, f } = useI18n();
  const c = t.match.ui.counter;
  const n = MONTHLY_PROPOSAL_LIMIT - used;
  return (
    <div className="v4-counter">
      <div className="v4-counter-top">
        <p className="v4-counter-num">
          <strong>{c.used(used, MONTHLY_PROPOSAL_LIMIT)}</strong> {c.usedIn(f.monthName(new Date()))}
        </p>
        <span className="v4-pill">{c.provisional}</span>
      </div>
      <div
        className="v4-dots"
        role="progressbar"
        aria-label={c.aria}
        aria-valuemin={0}
        aria-valuemax={MONTHLY_PROPOSAL_LIMIT}
        aria-valuenow={used}
        aria-valuetext={c.used(used, MONTHLY_PROPOSAL_LIMIT)}
      >
        {Array.from({ length: MONTHLY_PROPOSAL_LIMIT }, (_, k) => (
          <span key={k} className={k < used ? 'is-used' : undefined} />
        ))}
      </div>
      <p className="v4-counter-note">{n > 0 ? c.left(n) : c.none}</p>
    </div>
  );
}

export function Results() {
  const { locale, t } = useI18n();
  const v = t.variants;
  const r = v.v4.results;
  const L = labelsFor(locale);
  const demo = useFounderDemo();
  const { matches, excluded, proposals } = demo;
  const byId = useMemo(() => new Map(matches.map((m) => [m.item.id, m])), [matches]);
  const [deck, setDeck] = useState(() => createDeck(matches.map((m) => m.item.id)));
  const [message, setMessage] = useState('');
  const nameOf = (id: string) => byId.get(id)?.item.nome ?? '';
  const top = current(deck);
  const remainingProposals = left(proposals);
  const topSent = top ? isSent(proposals, top) : false;
  const blocked = remainingProposals === 0 && !topSent;
  const sentIds = proposals.sent;
  const passedIds = decided(deck, 'pass');

  const onDecide = (d: Decision) => {
    const id = current(deck);
    if (!id) return;
    const next = decide(deck, d);
    if (d === 'interested') {
      if (isSent(proposals, id)) {
        setMessage(r.alreadySent);
      } else {
        demo.propose(id);
        setMessage(t.match.ui.startup.proposalSent(nameOf(id), remainingProposals - 1));
      }
    } else {
      setMessage(r.passed(nameOf(id)));
    }
    setDeck(next);
    if (isDone(next)) setMessage((m) => `${m} ${v.v4.deck.doneAnnounce}`);
  };
  const onUndo = () => {
    const last = lastDecision(deck);
    if (!last || last.decision !== 'pass') return;
    setDeck(undo(deck));
    setMessage(v.v4.deck.undone(nameOf(last.id)));
  };
  const restart = () => {
    setDeck(createDeck(matches.map((m) => m.item.id)));
    setMessage(r.restarted);
  };

  return (
    <div className="v4-page v4-results">
      <header className="v4-head">
        <p className="v4-eyebrow">{r.eyebrow}</p>
        <h1 id="page-title" tabIndex={-1}>
          {t.match.ui.startup.resultsTitle(matches.length)}
        </h1>
        <p className="v4-lead">{r.lead}</p>
        <p className="v4-profile">{demo.profileLine}</p>
      </header>

      <div className="v4-layout">
        <section className="v4-main" aria-labelledby="page-title">
          <SwipeDeck
            deck={deck}
            renderCard={(id) => {
              const m = byId.get(id);
              if (!m) return null;
              return (
                <InvestorCard
                  investor={m.item}
                  evaluation={m.evaluation}
                  status={isSent(proposals, id) ? <p className="v4-card-status is-sent">{v.actions.proposed}</p> : undefined}
                />
              );
            }}
            onDecide={onDecide}
            onUndo={onUndo}
            canUndo={undoAllowed(deck)}
            undoLockedNote={undoLocked(deck) ? r.undoLocked : null}
            interestedDisabled={blocked}
            interestedNote={blocked ? t.match.ui.counter.none : null}
            onBlocked={() => setMessage(r.blocked)}
            interestedLabel={topSent ? v.actions.proposed : v.actions.interested}
            done={
              <div className="v4-done-card">
                <span className="v4-done-icon" aria-hidden="true">
                  ✓
                </span>
                <FocusHeading className="v4-done-title">{r.doneTitle}</FocusHeading>
                <p>{r.doneText(sentIds.length)}</p>
                <button type="button" className="v4-btn v4-btn-ghost" onClick={restart}>
                  {v.actions.restart}
                </button>
                <p className="v4-note">{r.restartNote}</p>
              </div>
            }
          />
        </section>

        <aside className="v4-side">
          <Counter used={proposals.counter.used} />

          <section className="v4-panel" aria-labelledby="v4-choices">
            <h2 id="v4-choices" className="v4-panel-title">
              {r.summaryTitle}
            </h2>
            <h3 className="v4-group-title">
              <span className="v4-dot v4-dot-yes" aria-hidden="true" />
              {r.proposedTitle(sentIds.length)}
            </h3>
            {sentIds.length === 0 ? (
              <p className="v4-empty">{r.noneProposed}</p>
            ) : (
              <>
                <ul className="v4-list">
                  {sentIds.map((id) => (
                    <li key={id}>
                      <span className="v4-list-name">{nameOf(id)}</span>
                      <span className="v4-chip v4-chip-neutral">{t.match.optin.neutralStartup.titolo}</span>
                    </li>
                  ))}
                </ul>
                <p className="v4-note">{t.match.optin.neutralStartup.testo}</p>
              </>
            )}
            <h3 className="v4-group-title">
              <span className="v4-dot v4-dot-no" aria-hidden="true" />
              {r.passedTitle(passedIds.length)}
            </h3>
            {passedIds.length === 0 ? (
              <p className="v4-empty">{r.nonePassed}</p>
            ) : (
              <ul className="v4-list">
                {passedIds.map((id) => (
                  <li key={id}>
                    <span className="v4-list-name">{nameOf(id)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {excluded.length > 0 && (
            <details className="v4-panel v4-excluded" open={isDone(deck) || undefined}>
              <summary>{t.match.ui.excluded.investors(excluded.length)}</summary>
              <ul className="v4-ex-list">
                {excluded.map((x) => (
                  <li key={x.item.id}>
                    <p className="v4-list-name">
                      {x.item.nome} <span className="v4-muted">· {L.tipo[x.item.tipo]}</span>
                    </p>
                    <ul className="v4-whynot">
                      {x.evaluation.whyNot.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </aside>
      </div>
      <LiveRegion message={message} />
    </div>
  );
}
