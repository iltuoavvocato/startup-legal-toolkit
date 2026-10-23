// V3 founder results: the agent walks the founder through the investor matches, one at a time.
import { useReducer } from 'react';
import { useI18n } from '../../i18n/context';
import { Rich } from '../../i18n/Rich';
import { WEIGHTS } from '../../lib/matching';
import { monthKey } from '../../lib/optin';
import { left as leftOf, isSent } from '../logic/proposals';
import { useFounderDemo } from '../shared/useDemo';
import { initChat, isFinished, reduce, type AgentBody } from './chat';
import { Conversation, type RenderedAgent } from './Conversation';
import { InvestorCard, PartsList, ReasonsList } from './parts';
import { useChipLabel } from './useChipLabel';

function monthDate(key: string): Date {
  const [y, m] = key.split('-').map(Number);
  return new Date(y!, (m ?? 1) - 1, 1);
}

export function Results() {
  const { t, f } = useI18n();
  const c = t.variants.v3;
  const demo = useFounderDemo();
  const { matches, excluded } = demo;
  const [state, dispatch] = useReducer(reduce, undefined, () =>
    initChat({ mode: 'founder', ids: matches.map((m) => m.item.id), excludedCount: excluded.length, month: monthKey(new Date()) }),
  );
  const chipLabel = useChipLabel();
  const counter = state.proposals.counter;
  const remaining = leftOf(state.proposals, state.limit);
  const C = t.match.ui.counter;

  const render = (body: AgentBody): RenderedAgent => {
    switch (body.kind) {
      case 'greet':
        return {
          content: (
            <>
              <p>{c.founder.hello}</p>
              <p className="v3-quote">{demo.profileLine}</p>
              <p>{c.founder.found(matches.length, excluded.length)}</p>
            </>
          ),
        };
      case 'criteria':
        return { content: <p>{c.founder.criteria(WEIGHTS.settore, WEIGHTS.ticket, WEIGHTS.fase, WEIGHTS.area)}</p> };
      case 'match': {
        const m = matches[body.index]!;
        return {
          wide: true,
          content: (
            <>
              <p>{c.founder.matchIntro(body.index + 1, matches.length)}</p>
              <InvestorCard
                investor={m.item}
                evaluation={m.evaluation}
                badge={isSent(state.proposals, m.item.id) ? c.founder.proposedBadge : undefined}
              />
            </>
          ),
        };
      }
      case 'why': {
        const m = matches[body.index]!;
        return {
          wide: true,
          content: (
            <>
              <p>{c.founder.whyIntro(m.item.nome)}</p>
              <ReasonsList reasons={m.evaluation.reasons} />
              <PartsList evaluation={m.evaluation} />
            </>
          ),
        };
      }
      case 'proposed': {
        const m = matches[body.index]!;
        const n = t.match.optin.neutralStartup;
        return {
          content: (
            <>
              <p>{c.founder.proposed(m.item.nome)}</p>
              <p className="v3-status-note">
                <strong>{n.titolo}.</strong> {n.testo}
              </p>
              <p>{c.founder.neverNo}</p>
              <p className="v3-small">{body.left > 0 ? C.left(body.left) : C.none}</p>
            </>
          ),
        };
      }
      case 'limit':
        return {
          content: (
            <>
              <p className="v3-warn">{t.match.optin.limitReached(state.limit)}</p>
              <p>{C.none}</p>
            </>
          ),
        };
      case 'excluded':
        return {
          wide: true,
          content: (
            <>
              <p>{c.founder.excludedIntro(excluded.length)}</p>
              <ul className="v3-excluded">
                {excluded.map((x) => (
                  <li key={x.item.id}>
                    <strong>{x.item.nome}</strong>
                    <span>{x.evaluation.whyNot.join(' · ')}</span>
                  </li>
                ))}
              </ul>
            </>
          ),
        };
      case 'end':
        return {
          content: (
            <>
              <p>{c.founder.end(matches.length)}</p>
              <p>{body.proposed > 0 ? c.founder.endProposed(body.proposed) : c.founder.endNone}</p>
              <p className="v3-small">{body.left > 0 ? C.left(body.left) : C.none}</p>
            </>
          ),
        };
      default:
        return { content: null };
    }
  };

  return (
    <div className="v3-page">
      <header className="v3-pagehead">
        <p className="v3-eyebrow">{c.results.eyebrow}</p>
        <h1 id="page-title" tabIndex={-1}>
          <Rich text={c.results.title} />
        </h1>
        <p className="v3-lead">{c.results.lead}</p>
      </header>
      <div className="v3-layout">
        <Conversation
          state={state}
          onChip={dispatch}
          renderAgent={render}
          chipLabel={chipLabel}
          status={isFinished(state) ? c.results.allSeen(matches.length) : c.results.progress(state.cursor + 1, matches.length)}
        />
        <aside className="v3-aside">
          <section className="v3-panel">
            <h2>{c.results.asideTitle}</h2>
            <p>{demo.profileLine}</p>
          </section>
          <section className="v3-panel">
            <h2>{c.results.counterTitle}</h2>
            <p className="v3-counter">
              <strong>{C.used(counter.used, state.limit)}</strong> {C.usedIn(f.monthName(monthDate(counter.month)))}{' '}
              <span className="v3-small">({C.provisional})</span>
            </p>
            <span className="v3-meter" aria-hidden="true">
              <span style={{ width: `${(counter.used / state.limit) * 100}%` }} />
            </span>
            <p className="v3-small">{remaining > 0 ? C.left(remaining) : C.none}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
