// V3 guided agent chat (mock): the sample conversation already filled in, the top three matches and two quick replies.
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { labelsFor } from '../../lib/matchTaxonomy';
import { useAgentMock } from '../shared/useMockScreens';
import { AgentBubble, Avatar, ScorePill, UserBubble } from './parts';

export function Agent() {
  const { locale, t, path } = useI18n();
  const c = t.variants.agentMock;
  const v3 = t.variants.v3;
  const L = labelsFor(locale);
  const mock = useAgentMock();
  const last = mock.script.length - 1;

  return (
    <div className="v3-page">
      <header className="v3-pagehead">
        <p className="v3-eyebrow">{t.variants.variants.v3.name}</p>
        <h1 id="page-title" tabIndex={-1}>
          {t.variants.screens.agent}
        </h1>
        <p className="v3-lead">{c.note}</p>
      </header>
      <div className="v3-layout">
        <section className="v3-chat" aria-label={v3.logLabel}>
          <header className="v3-chat-head">
            <Avatar small />
            <div className="v3-chat-who">
              <p className="v3-chat-name">{v3.agentName}</p>
              <p className="v3-chat-role">{v3.agentRole}</p>
            </div>
          </header>
          <div className="v3-log-wrap" role="log" aria-live="polite" aria-relevant="additions" aria-label={v3.logLabel}>
            <ol className="v3-log">
              {mock.script.map((line, k) => {
                if (line.from === 'user') return <UserBubble key={line.key}>{line.text}</UserBubble>;
                const continued = mock.script[k - 1]?.from === 'agent';
                if (k !== last) {
                  return (
                    <AgentBubble key={line.key} continued={continued}>
                      <p>{line.text}</p>
                    </AgentBubble>
                  );
                }
                return (
                  <AgentBubble key={line.key} continued={continued} wide>
                    <p>{line.text}</p>
                    <ol className="v3-mock-top">
                      {mock.top.map(({ item, evaluation }) => (
                        <li key={item.id} className="v3-card">
                          <div className="v3-card-head">
                            <div className="v3-card-id">
                              <p className="v3-card-name">{item.nome}</p>
                              <p className="v3-card-meta">{L.tipo[item.tipo]}</p>
                            </div>
                            <ScorePill score={evaluation.score} />
                          </div>
                          {evaluation.reasons[0] && <p className="v3-card-thesis">{evaluation.reasons[0]}</p>}
                        </li>
                      ))}
                    </ol>
                  </AgentBubble>
                );
              })}
              {mock.replies.flatMap((r) => [
                <UserBubble key={`q-${r.chip}`} isNew>
                  {r.question}
                </UserBubble>,
                <AgentBubble key={`r-${r.chip}`} isNew>
                  <p>{r.answer}</p>
                </AgentBubble>,
              ])}
            </ol>
          </div>
          <div className="v3-chips" role="group" aria-label={c.quickReplies}>
            {mock.chips.map(({ chip, label }) => (
              <button key={chip} type="button" className="v3-chip" onClick={() => mock.ask(chip)}>
                {label}
              </button>
            ))}
            <Link className="v3-chip is-primary v3-mock-link" to={path('matchAgentStartup')}>
              {c.openReal} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
        <aside className="v3-aside">
          <section className="v3-panel">
            <h2>{v3.results.asideTitle}</h2>
            <p>{mock.profileLine}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
