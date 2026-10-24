import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { labelsFor } from '../../lib/matchTaxonomy';
import { useAgentMock } from '../shared/useMockScreens';
import { pad2 } from './logic';

/** V5 agent chat: a terminal-like transcript, mono prompts, the top three matches as a readout. */
export function Agent() {
  const { t, locale, path } = useI18n();
  const c = t.variants.agentMock;
  const tipo = labelsFor(locale).tipo;
  const mock = useAgentMock();
  const [status, setStatus] = useState('');
  const line = (from: 'agent' | 'user') => (from === 'agent' ? c.agent : c.you);

  return (
    <div className="v5-page v5-agent">
      <header className="v5-agent-head">
        <p className="v5-micro">{t.variants.v5.label.product}</p>
        <h1 id="page-title" tabIndex={-1}>
          {t.variants.screens.agent}
        </h1>
        <p className="v5-muted v5-small">{mock.profileLine}</p>
      </header>

      <div className="v5-term" role="log" aria-label={t.variants.screens.agent}>
        <ol className="v5-term-lines">
          {mock.script.map((l) => (
            <li key={l.key} className={`v5-term-line v5-term-${l.from}`}>
              <span className="v5-term-who">{line(l.from)}</span>
              <span className="v5-term-text">{l.text}</span>
            </li>
          ))}
          <li className="v5-term-line v5-term-agent v5-term-wide">
            <span className="v5-term-who">{c.agent}</span>
            <ol className="v5-term-matches">
              {mock.top.map(({ item, evaluation }, i) => (
                <li key={item.id} className="v5-term-match">
                  <span className="v5-term-rank" aria-hidden="true">
                    {pad2(i + 1)}
                  </span>
                  <span className="v5-term-match-body">
                    <span className="v5-name">{item.nome}</span>
                    <span className="v5-muted v5-small">{tipo[item.tipo]}</span>
                    {evaluation.reasons[0] && <span className="v5-small v5-term-reason">{evaluation.reasons[0]}</span>}
                  </span>
                  <span className="v5-term-score">
                    <span className="v5-gold">{evaluation.score}</span>
                    <span className="v5-muted">/100</span>
                  </span>
                </li>
              ))}
            </ol>
          </li>
          {mock.replies.map((r) => (
            <li key={r.chip} className="v5-term-pair">
              <p className="v5-term-line v5-term-user">
                <span className="v5-term-who">{c.you}</span>
                <span className="v5-term-text">{r.question}</span>
              </p>
              <p className="v5-term-line v5-term-agent">
                <span className="v5-term-who">{c.agent}</span>
                <span className="v5-term-text">{r.answer}</span>
              </p>
            </li>
          ))}
        </ol>
      </div>

      <section className="v5-term-replies" aria-labelledby="v5-quick-title">
        <h2 id="v5-quick-title" className="v5-micro">
          {c.quickReplies}
        </h2>
        <div className="v5-ctas">
          {mock.chips.map((chip) => (
            <button
              key={chip.chip}
              type="button"
              className="v5-btn v5-btn-ghost v5-chip"
              onClick={() => {
                mock.ask(chip.chip);
                setStatus(chip.label);
              }}
            >
              <span className="v5-gold v5-chip-mark" aria-hidden="true">
                &gt;
              </span>
              {chip.label}
            </button>
          ))}
          <Link className="v5-btn v5-btn-primary" to={path('matchAgentStartup')}>
            {c.openReal}
          </Link>
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {status}
        </p>
        <p className="v5-muted v5-small v5-mock-note">{c.note}</p>
      </section>
    </div>
  );
}
