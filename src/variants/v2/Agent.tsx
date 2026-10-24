// V2 Dashboard: guided agent chat as a console — transcript panel, profile summary and a mini results table.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { labelsFor } from '../../lib/matchTaxonomy';
import type { QuickReply } from '../logic/mock';
import { useAgentMock } from '../shared/useMockScreens';
import { BandChip, Eyebrow, ScoreCell, StatusLine } from './parts';

export function Agent() {
  const { t, locale, path } = useI18n();
  const c = t.variants.agentMock;
  const cols = t.variants.v2.results.cols;
  const L = labelsFor(locale);
  const mock = useAgentMock();
  const [status, setStatus] = useState('');

  const onAsk = (chip: QuickReply, label: string) => {
    mock.ask(chip);
    setStatus(`${c.you}: ${label}`);
  };

  return (
    <div className="v2-page v2-agent">
      <header className="v2-head">
        <div>
          <Eyebrow>{t.variants.v2.landing.eyebrow}</Eyebrow>
          <h1 id="page-title" tabIndex={-1} className="v2-h1">
            {t.variants.screens.agent}
          </h1>
          <p className="v2-muted">{mock.profileLine}</p>
        </div>
        <Link className="v2-btn v2-btn-primary" to={path('matchAgentStartup')}>
          {c.openReal} <span aria-hidden="true">→</span>
        </Link>
      </header>

      <div className="v2-layout v2-agent-layout">
        <div className="v2-main">
          <section className="v2-panel v2-console" aria-labelledby="v2-console-h">
            <div className="v2-panel-row">
              <h2 id="v2-console-h" className="v2-panel-h">
                {c.agent}
              </h2>
              <span className="v2-muted v2-small v2-num">{mock.script.length + mock.replies.length * 2}</span>
            </div>
            <div role="log" aria-labelledby="v2-console-h" className="v2-log" tabIndex={0}>
              <ol className="v2-log-list">
                {mock.script.map((line) => (
                  <li key={line.key} className={`v2-log-line v2-log-${line.from}`}>
                    <span className="v2-log-who">{line.from === 'agent' ? c.agent : c.you}</span>
                    <span className="v2-log-text">{line.text}</span>
                  </li>
                ))}
                {mock.replies.map((r) => [
                  <li key={`q-${r.chip}`} className="v2-log-line v2-log-user">
                    <span className="v2-log-who">{c.you}</span>
                    <span className="v2-log-text">{r.question}</span>
                  </li>,
                  <li key={`r-${r.chip}`} className="v2-log-line v2-log-agent">
                    <span className="v2-log-who">{c.agent}</span>
                    <span className="v2-log-text">{r.answer}</span>
                  </li>,
                ])}
              </ol>
            </div>
            {mock.chips.length > 0 && (
              <div className="v2-quick" role="group" aria-label={c.quickReplies}>
                <span className="v2-quick-label">{c.quickReplies}</span>
                {mock.chips.map(({ chip, label }) => (
                  <button key={chip} type="button" className="v2-btn v2-btn-sm" onClick={() => onAsk(chip, label)}>
                    {label}
                  </button>
                ))}
              </div>
            )}
            <StatusLine message={status} />
          </section>

          <section className="v2-card" aria-labelledby="v2-agent-top-h">
            <h2 id="v2-agent-top-h" className="v2-h2">
              {c.summary(mock.total)}
            </h2>
            <div className="v2-scroll" tabIndex={0} role="region" aria-labelledby="v2-agent-top-h">
              <table className="v2-table v2-table-agent">
                <thead>
                  <tr>
                    <th scope="col" className="v2-c-rank">
                      {cols.rank}
                    </th>
                    <th scope="col">{cols.nome}</th>
                    <th scope="col" className="v2-hide-sm">
                      {cols.tipo}
                    </th>
                    <th scope="col" className="v2-c-score">
                      {cols.score}
                    </th>
                    <th scope="col" className="v2-hide-sm">
                      {cols.band}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mock.top.map(({ item, evaluation }, i) => (
                    <tr key={item.id}>
                      <td className="v2-c-rank v2-num">{i + 1}</td>
                      <td>
                        <span className="v2-name">{item.nome}</span>
                        {evaluation.reasons[0] && <span className="v2-agent-reason">{evaluation.reasons[0]}</span>}
                      </td>
                      <td className="v2-hide-sm">{L.tipo[item.tipo]}</td>
                      <td className="v2-c-score">
                        <ScoreCell evaluation={evaluation} />
                      </td>
                      <td className="v2-hide-sm">
                        <BandChip score={evaluation.score} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="v2-side" aria-label={t.variants.screens.agent}>
          <section className="v2-panel" aria-labelledby="v2-agent-profile-h">
            <h2 id="v2-agent-profile-h" className="v2-panel-h">
              {c.you}
            </h2>
            <dl className="v2-agent-facts">
              {mock.script
                .filter((l) => l.from === 'user')
                .map((l) => (
                  <div key={l.key}>
                    <dt>{mock.script.find((x) => x.key === `q-${l.key.slice(2)}`)?.text}</dt>
                    <dd>{l.text}</dd>
                  </div>
                ))}
            </dl>
          </section>
          <p className="v2-panel v2-muted v2-small">{c.note}</p>
        </aside>
      </div>
    </div>
  );
}
