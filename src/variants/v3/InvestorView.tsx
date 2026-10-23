// V3 investor view: the agent presents anonymous teasers one by one; names appear only with an intro.
import { useReducer } from 'react';
import { useI18n } from '../../i18n/context';
import { Rich } from '../../i18n/Rich';
import { monthKey } from '../../lib/optin';
import { bucketCounts, bucketOf, investorStatus, stateOf, type InvestorBucket } from '../logic/board';
import { useInvestorDemo } from '../shared/useDemo';
import { initChat, isFinished, reduce, type AgentBody } from './chat';
import { Conversation, type RenderedAgent } from './Conversation';
import { ReasonsList, PartsList, TeaserCard } from './parts';
import { useChipLabel } from './useChipLabel';

const BUCKETS: readonly InvestorBucket[] = ['inviato', 'intro', 'passato', 'nuovo'];

export function Investor() {
  const { locale, t } = useI18n();
  const c = t.variants.v3;
  const I = c.investor;
  const demo = useInvestorDemo();
  const { matches } = demo;
  const [state, dispatch] = useReducer(reduce, undefined, () =>
    initChat({ mode: 'investor', ids: matches.map((m) => m.item.id), excludedCount: demo.excluded.length, month: monthKey(new Date()) }),
  );
  const chipLabel = useChipLabel();
  const board = state.board;
  const counts = bucketCounts(board, state.ids);

  const card = (index: number) => {
    const m = matches[index]!;
    const id = m.item.id;
    const bucket = bucketOf(board, id);
    return (
      <TeaserCard
        startup={m.item}
        evaluation={m.evaluation}
        revealed={stateOf(board, id) === 'intro'}
        status={bucket === 'nuovo' ? undefined : t.variants.buckets[bucket]}
      />
    );
  };

  const render = (body: AgentBody): RenderedAgent => {
    switch (body.kind) {
      case 'greet':
        return {
          content: (
            <>
              <p>{I.hello}</p>
              <p className="v3-quote">{demo.thesisLine}</p>
              <p>{I.found(matches.length)}</p>
            </>
          ),
        };
      case 'match':
        return {
          wide: true,
          content: (
            <>
              <p>{I.teaserIntro(body.index + 1, matches.length)}</p>
              {card(body.index)}
            </>
          ),
        };
      case 'why': {
        const m = matches[body.index]!;
        return {
          wide: true,
          content: (
            <>
              <p>{I.whyIntro}</p>
              <ReasonsList reasons={m.evaluation.reasons} />
              <PartsList evaluation={m.evaluation} />
            </>
          ),
        };
      }
      case 'interested': {
        // Status right after the interest: always "interest sent", whatever happens next.
        const w = t.match.optin.waitingInvestor;
        return {
          content: (
            <>
              <p className="v3-status-note">
                <strong>{w.titolo}.</strong> {w.testo}
              </p>
              <p>{I.interestedAsk}</p>
              <p className="v3-small">{t.variants.replyNote}</p>
            </>
          ),
        };
      }
      case 'passed': {
        const p = t.match.optin.investorClosed;
        return {
          content: (
            <p className="v3-status-note">
              <strong>{p.titolo}.</strong> {t.variants.passNote}
            </p>
          ),
        };
      }
      case 'reply': {
        const m = matches[body.index]!;
        if (body.intro) {
          const v = investorStatus(board, m.item.id, locale);
          return {
            content: (
              <>
                <p>{I.introGood}</p>
                <p className="v3-status-note">
                  <strong>{v.titolo}.</strong> {v.testo}
                </p>
                <p>
                  {I.revealLabel} <strong>{t.variants.introReveal(m.item.nome, m.item.founder)}</strong>
                </p>
              </>
            ),
          };
        }
        // Declined or not answered yet: the investor sees the same neutral status.
        const w = t.match.optin.waitingInvestor;
        return {
          content: (
            <p className="v3-status-note">
              <strong>{w.titolo}.</strong> {w.testo}
            </p>
          ),
        };
      }
      case 'summary':
        return {
          content: (
            <>
              <p>{I.summaryIntro}</p>
              <ul className="v3-counts">
                {BUCKETS.map((b) => (
                  <li key={b}>
                    <strong>{body.counts[b]}</strong> {t.variants.buckets[b]}
                  </li>
                ))}
              </ul>
              <p className="v3-small">{I.summaryNote}</p>
              <p>{I.restartHint}</p>
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
        <p className="v3-eyebrow">{t.variants.screens.investor}</p>
        <h1 id="page-title" tabIndex={-1}>
          <Rich text={I.title} />
        </h1>
        <p className="v3-lead">{I.lead}</p>
      </header>
      <div className="v3-layout">
        <Conversation
          state={state}
          onChip={dispatch}
          renderAgent={render}
          chipLabel={chipLabel}
          status={isFinished(state) ? I.allSeen(matches.length) : I.progress(state.cursor + 1, matches.length)}
        />
        <aside className="v3-aside">
          <section className="v3-panel">
            <h2>{I.asideTitle}</h2>
            <p>{demo.thesisLine}</p>
            <p className="v3-small">{t.match.ui.investor.anonymousNote}</p>
          </section>
          <section className="v3-panel">
            <h2>{I.countsTitle}</h2>
            <ul className="v3-counts">
              {BUCKETS.map((b) => (
                <li key={b}>
                  <strong>{counts[b]}</strong> {t.variants.buckets[b]}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
