// V4 guided agent chat (mock): the conversation as stacked question cards, each with its answer chip, then the top
// three matches as compact cards and the quick replies. Scripted from the fictional sample profile.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LiveRegion } from '../../components/match/LiveRegion';
import { useI18n } from '../../i18n/context';
import { labelsFor } from '../../lib/matchTaxonomy';
import type { ScriptLine } from '../logic/mock';
import { useAgentMock } from '../shared/useMockScreens';
import { ScoreRing } from './cards';

/** Groups the script into cards: an agent line plus the user's answer that follows it, if any. */
function toCards(script: ScriptLine[]): { agent: ScriptLine; answer?: ScriptLine }[] {
  const cards: { agent: ScriptLine; answer?: ScriptLine }[] = [];
  for (const line of script) {
    const last = cards[cards.length - 1];
    if (line.from === 'user' && last && !last.answer) last.answer = line;
    else if (line.from === 'agent') cards.push({ agent: line });
  }
  return cards;
}

export function Agent() {
  const { locale, t, path } = useI18n();
  const c = t.variants.agentMock;
  const L = labelsFor(locale);
  const demo = useAgentMock();
  const [message, setMessage] = useState('');
  const cards = toCards(demo.script);
  const steps = cards.filter((x) => x.answer).length;

  return (
    <div className="v4-page v4-agent">
      <header className="v4-head">
        <p className="v4-eyebrow">{c.agent}</p>
        <h1 id="page-title" tabIndex={-1}>
          {t.variants.screens.agent}
        </h1>
        <p className="v4-profile">{demo.profileLine}</p>
      </header>

      <div className="v4-agent-layout">
        <section className="v4-agent-chat" aria-labelledby="v4-agent-chat-title">
          <h2 id="v4-agent-chat-title" className="sr-only">
            {t.variants.screens.agent}
          </h2>
          <div role="log" aria-label={t.variants.screens.agent}>
            <ol className="v4-qcards">
              {cards.map(({ agent, answer }, k) => (
                <li key={agent.key} className={`v4-qcard${answer ? '' : ' is-plain'}`}>
                  {answer ? (
                    <span className="v4-qcard-step" aria-hidden="true">
                      {k}/{steps}
                    </span>
                  ) : null}
                  <p className="v4-qcard-q">
                    <span className="sr-only">{c.agent}: </span>
                    {agent.text}
                  </p>
                  {answer ? (
                    <p className="v4-qcard-a">
                      <span className="sr-only">{c.you}: </span>
                      <span className="v4-answer-chip">{answer.text}</span>
                    </p>
                  ) : null}
                </li>
              ))}
              {demo.replies.map((r) => (
                <li key={r.chip} className="v4-qcard is-reply">
                  <p className="v4-qcard-a v4-qcard-a-start">
                    <span className="sr-only">{c.you}: </span>
                    <span className="v4-answer-chip">{r.question}</span>
                  </p>
                  <p className="v4-qcard-q">
                    <span className="sr-only">{c.agent}: </span>
                    {r.answer}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          {demo.chips.length > 0 ? (
            <div className="v4-quick">
              <h3 className="v4-quick-title">{c.quickReplies}</h3>
              <div className="v4-quick-row">
                {demo.chips.map(({ chip, label }) => (
                  <button
                    key={chip}
                    type="button"
                    className="v4-btn v4-btn-small"
                    onClick={() => {
                      demo.ask(chip);
                      setMessage(label);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <LiveRegion message={message} />
        </section>

        <section className="v4-agent-top" aria-labelledby="v4-agent-top-title">
          <h2 id="v4-agent-top-title">{t.match.ui.startup.resultsTitle(demo.total)}</h2>
          <ol className="v4-mini-cards">
            {demo.top.map(({ item, evaluation }) => (
              <li key={item.id} className="v4-mini-card">
                <ScoreRing score={evaluation.score} small />
                <div className="v4-mini-body">
                  <h3>{item.nome}</h3>
                  <p className="v4-mini-meta">{L.tipo[item.tipo]}</p>
                  {evaluation.reasons[0] ? <p className="v4-mini-reason">{evaluation.reasons[0]}</p> : null}
                </div>
              </li>
            ))}
          </ol>
          <p className="v4-note">{c.note}</p>
          <div className="v4-ctas">
            <Link className="v4-cta v4-cta-primary" to={path('matchAgentStartup')}>
              {c.openReal} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
