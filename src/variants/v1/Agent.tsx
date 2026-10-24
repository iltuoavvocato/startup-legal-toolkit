import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { labelsFor } from '../../lib/matchTaxonomy';
import { useAgentMock } from '../shared/useMockScreens';
import { rankNumeral } from './editorial';
import { Announcer, Masthead, ScoreLine } from './parts';

/** The guided agent chat as a printed interview: speaker labels in small caps, answers in serif italic. */
export function Agent() {
  const { locale, t, path } = useI18n();
  const c = t.variants.agentMock;
  const L = labelsFor(locale);
  const mock = useAgentMock();
  const [message, setMessage] = useState('');
  const lastReply = useRef<HTMLLIElement>(null);
  const count = mock.replies.length;

  // A quick reply moves focus to the agent's answer, so the next chip (or the link) follows in reading order.
  useEffect(() => {
    if (count > 0) lastReply.current?.focus();
  }, [count]);

  return (
    <article className="v1-page v1-agent">
      <header className="v1-cover v1-cover-sm">
        <Masthead />
        <p className="v1-kicker">{c.agent}</p>
        <h1 id="page-title" tabIndex={-1} className="v1-display v1-display-sm">
          {t.variants.screens.agent}
        </h1>
        <p className="v1-smallcaps">{mock.profileLine}</p>
      </header>

      <div className="v1-column v1-interview" role="log" aria-label={t.variants.screens.agent}>
        <ol className="v1-interview-list">
          {mock.script.map((line) => (
            <li key={line.key} className={`v1-line v1-line-${line.from}`}>
              <span className="v1-speaker">{line.from === 'agent' ? c.agent : c.you}</span>
              <p className="v1-line-text">{line.text}</p>
            </li>
          ))}
          {mock.replies.map((r, i) => [
            <li key={`q-${r.chip}`} className="v1-line v1-line-user">
              <span className="v1-speaker">{c.you}</span>
              <p className="v1-line-text">{r.question}</p>
            </li>,
            <li
              key={`a-${r.chip}`}
              className="v1-line v1-line-agent"
              tabIndex={-1}
              ref={i === count - 1 ? lastReply : undefined}
            >
              <span className="v1-speaker">{c.agent}</span>
              <p className="v1-line-text">{r.answer}</p>
            </li>,
          ])}
        </ol>
      </div>

      <section className="v1-column v1-agent-top" aria-labelledby="v1-agent-top-title">
        <h2 id="v1-agent-top-title" className="v1-smallcaps v1-agent-top-title">
          {t.variants.screens.results} · {mock.total}
        </h2>
        <ol className="v1-index">
          {mock.top.map(({ item, evaluation }, i) => (
            <li key={item.id} className="v1-entry">
              <span className="v1-rank v1-rank-sm" aria-hidden="true">
                {rankNumeral(i + 1)}
              </span>
              <div className="v1-entry-body">
                <p className="v1-meta">{L.tipo[item.tipo]}</p>
                <h3 className="v1-headline v1-headline-sm">{item.nome}</h3>
                <ScoreLine score={evaluation.score} />
                {evaluation.reasons[0] ? <p className="v1-standfirst v1-standfirst-sm">{evaluation.reasons[0]}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {mock.chips.length > 0 ? (
        <div className="v1-column v1-quick" role="group" aria-label={c.quickReplies}>
          <p className="v1-smallcaps" aria-hidden="true">
            {c.quickReplies}
          </p>
          <div className="v1-quick-list">
            {mock.chips.map(({ chip, label }) => (
              <button
                key={chip}
                type="button"
                className="v1-chip"
                onClick={() => {
                  mock.ask(chip);
                  setMessage(label);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="v1-column v1-mock-foot">
        <p className="v1-note">{c.note}</p>
        <p>
          <Link className="v1-textlink" to={path('matchAgentStartup')}>
            {c.openReal} <span aria-hidden="true">→</span>
          </Link>
        </p>
      </div>
      <Announcer message={message} />
    </article>
  );
}
