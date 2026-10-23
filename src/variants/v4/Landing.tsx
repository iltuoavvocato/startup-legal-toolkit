// V4 landing: hero with a playable mini-deck of three real sample matches, how it works as swipeable cards,
// the legal limits, and the two doors (founder results, investor view).
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LiveRegion } from '../../components/match/LiveRegion';
import { useI18n } from '../../i18n/context';
import { Rich } from '../../i18n/Rich';
import { createDeck, current, decide, decided, lastDecision, undo, type Decision } from '../logic/deck';
import { variantRouteId } from '../registry';
import { useFounderDemo } from '../shared/useDemo';
import { FocusHeading, InvestorCard } from './cards';
import { SwipeDeck } from './SwipeDeck';
import { undoAllowed } from './swipe';

export function Landing() {
  const { t, path } = useI18n();
  const v = t.variants;
  const x = v.v4.landing;
  const ui = t.match.ui;
  const demo = useFounderDemo();
  const sample = useMemo(() => demo.matches.slice(0, 3), [demo.matches]);
  const byId = useMemo(() => new Map(sample.map((m) => [m.item.id, m])), [sample]);
  const [deck, setDeck] = useState(() => createDeck(sample.map((m) => m.item.id)));
  const [message, setMessage] = useState('');
  const nameOf = (id: string) => byId.get(id)?.item.nome ?? '';
  const resultsPath = path(variantRouteId('v4', 'results'));
  const investorPath = path(variantRouteId('v4', 'investor'));

  const onDecide = (d: Decision) => {
    const id = current(deck);
    if (!id) return;
    setDeck(decide(deck, d));
    setMessage(d === 'interested' ? x.liked(nameOf(id)) : x.passed(nameOf(id)));
  };
  const onUndo = () => {
    const last = lastDecision(deck);
    if (!last || last.decision !== 'pass') return;
    setDeck(undo(deck));
    setMessage(v.v4.deck.undone(nameOf(last.id)));
  };
  const restart = () => {
    setDeck(createDeck(sample.map((m) => m.item.id)));
    setMessage(v.v4.results.restarted);
  };

  const limits = [...ui.limits.items, x.optinItem];

  return (
    <div className="v4-page v4-landing">
      <section className="v4-hero">
        <div className="v4-hero-text">
          <p className="v4-eyebrow">{x.eyebrow}</p>
          <h1 id="page-title" tabIndex={-1}>
            <Rich text={ui.landing.title} />
          </h1>
          <p className="v4-lead">{ui.landing.lead}</p>
          <div className="v4-ctas">
            <Link className="v4-cta v4-cta-primary" to={resultsPath}>
              {x.ctaResults}
            </Link>
            <Link className="v4-cta v4-cta-secondary" to={investorPath}>
              {x.ctaInvestor}
            </Link>
          </div>
        </div>
        <section className="v4-hero-deck" aria-labelledby="v4-try">
          <h2 id="v4-try" className="v4-try-title">
            {x.deckTitle}
          </h2>
          <p className="v4-try-lead">{x.deckLead}</p>
          <SwipeDeck
            size="mini"
            deck={deck}
            renderCard={(id) => {
              const m = byId.get(id);
              return m ? <InvestorCard investor={m.item} evaluation={m.evaluation} reasons={2} compact headingLevel={3} /> : null;
            }}
            onDecide={onDecide}
            onUndo={onUndo}
            canUndo={undoAllowed(deck)}
            done={
              <div className="v4-done-card v4-done-mini">
                <span className="v4-done-icon" aria-hidden="true">
                  ✓
                </span>
                <FocusHeading level={3} className="v4-done-title">
                  {x.doneTitle}
                </FocusHeading>
                <p>{x.doneText(decided(deck, 'interested').length)}</p>
                <div className="v4-done-actions">
                  <Link className="v4-cta v4-cta-primary" to={resultsPath}>
                    {x.ctaResults}
                  </Link>
                  <button type="button" className="v4-btn v4-btn-ghost" onClick={restart}>
                    {v.actions.restart}
                  </button>
                </div>
              </div>
            }
          />
          <p className="v4-note v4-try-note">{x.demoNote}</p>
        </section>
      </section>

      <section className="v4-section" aria-labelledby="v4-how">
        <h2 id="v4-how" className="v4-section-title">
          {ui.landing.howTitle}
        </h2>
        <p className="v4-section-lead">{ui.landing.howLead}</p>
        <p className="v4-scroll-hint">{x.scrollHint}</p>
        <ol className="v4-steps" tabIndex={0} aria-labelledby="v4-how">
          {ui.landing.steps.map((s, i) => (
            <li key={s.title} className="v4-step">
              <span className="v4-step-n">{x.stepLabel(i + 1)}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="v4-section" aria-labelledby="v4-limits">
        <h2 id="v4-limits" className="v4-section-title">
          {ui.limits.title}
        </h2>
        <p className="v4-section-lead">{x.limitsLead}</p>
        <ul className="v4-limits">
          {limits.map((l) => (
            <li key={l.title} className="v4-limit">
              <h3>{l.title}</h3>
              <p>{l.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="v4-section" aria-labelledby="v4-doors">
        <h2 id="v4-doors" className="v4-section-title">
          {ui.landing.doorsTitle}
        </h2>
        <p className="v4-section-lead">{x.doorsLead}</p>
        <div className="v4-doors">
          <Link className="v4-door v4-door-founder" to={resultsPath}>
            <span className="v4-door-title">{ui.landing.startupDoor.title}</span>
            <span className="v4-door-text">{x.founderDoor}</span>
            <span className="v4-door-cta">{x.ctaResults} →</span>
          </Link>
          <Link className="v4-door v4-door-investor" to={investorPath}>
            <span className="v4-door-title">{ui.landing.investorDoor.title}</span>
            <span className="v4-door-text">{x.investorDoor}</span>
            <span className="v4-door-cta">{x.ctaInvestor} →</span>
          </Link>
        </div>
      </section>
      <LiveRegion message={message} />
    </div>
  );
}
