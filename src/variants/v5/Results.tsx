import { useRef, useState, type KeyboardEvent } from 'react';
import { useI18n } from '../../i18n/context';
import { scoreBand, type Ranked } from '../../lib/matching';
import { labelsFor, type Investor } from '../../lib/matchTaxonomy';
import { MONTHLY_PROPOSAL_LIMIT } from '../../lib/optin';
import { isSent, left, propose, type Proposals } from '../logic/proposals';
import { useFounderDemo } from '../shared/useDemo';
import { nextIndex, pad2 } from './logic';
import { Counter, PartBars } from './ui';

interface DetailProps {
  m: Ranked<Investor>;
  proposals: Proposals;
  onPropose: (m: Ranked<Investor>) => void;
  /** Distinguishes the inline (mobile) and side (desktop) copies of the panel. */
  where: 'inline' | 'side';
}

function Detail({ m, proposals, onPropose, where }: DetailProps) {
  const { t, f, locale } = useI18n();
  const c = t.variants.v5;
  const L = labelsFor(locale);
  const i = m.item;
  const e = m.evaluation;
  const band = scoreBand(e.score, locale);
  const sent = isSent(proposals, i.id);
  const neutral = t.match.optin.neutralStartup;
  const titleId = `v5-detail-${where}-${i.id}`;
  return (
    <section className={`v5-detail v5-detail-${where}`} aria-labelledby={titleId}>
      <div className="v5-detail-head">
        <div>
          <p className="v5-micro">
            {L.tipo[i.tipo]} · {i.referente}
          </p>
          <h2 id={titleId} className="v5-detail-name">
            {i.nome}
          </h2>
        </div>
        <p className="v5-score-xl v5-score-lg">
          <span className="v5-gold">{e.score}</span>
          <span className="v5-score-of">/100</span>
          <span className="v5-band">{band.label}</span>
        </p>
      </div>
      <p className="v5-thesis">{i.tesi}</p>
      <dl className="v5-facts">
        <div>
          <dt>{c.label.ticket}</dt>
          <dd>{c.results.ticketRange(f.euro(i.ticketMin), f.euro(i.ticketMax))}</dd>
        </div>
        <div>
          <dt>{t.match.ui.startup.chipFase}</dt>
          <dd>{i.fasi.map((x) => L.fase[x]).join(', ')}</dd>
        </div>
      </dl>
      <h3 className="v5-micro v5-h3">{t.match.ui.reasonsLabel}</h3>
      <ul className="v5-reasons">
        {e.reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <h3 className="v5-micro v5-h3">{c.label.parts}</h3>
      <PartBars parts={e.parts} />
      <div className="v5-propose">
        {sent ? (
          <div className="v5-neutral">
            <p className="v5-tag v5-tag-on">{c.results.proposedTag}</p>
            <p className="v5-neutral-title">{neutral.titolo}</p>
            <p className="v5-muted v5-small">{neutral.testo}</p>
          </div>
        ) : (
          <>
            <button type="button" className="v5-btn v5-btn-primary" onClick={() => onPropose(m)}>
              {t.variants.actions.propose}
            </button>
            <p className="v5-muted v5-small">{c.results.proposeNote}</p>
          </>
        )}
        {proposals.error && !sent && <p className="v5-error">{proposals.error}</p>}
      </div>
    </section>
  );
}

export function Results() {
  const { t, locale } = useI18n();
  const c = t.variants.v5;
  const demo = useFounderDemo();
  const [sel, setSel] = useState(0);
  const [msg, setMsg] = useState('');
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const matches = demo.matches;
  const current = matches[Math.min(sel, matches.length - 1)];
  const L = labelsFor(locale);

  const select = (i: number) => {
    setSel(i);
    const m = matches[i];
    if (m) setMsg(c.results.selected(m.item.nome));
  };

  const onKey = (ev: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = nextIndex(ev.key, i, matches.length);
    if (n === null) return;
    ev.preventDefault();
    select(n);
    btns.current[n]?.focus();
  };

  const onPropose = (m: Ranked<Investor>) => {
    const next = propose(demo.proposals, m.item.id, locale);
    demo.propose(m.item.id);
    setMsg(next.error ?? `${t.match.ui.startup.proposalSent(m.item.nome, left(next))} ${t.match.optin.neutralStartup.titolo}.`);
  };

  return (
    <div className="v5-page v5-results">
      <header className="v5-head">
        <div className="v5-head-copy">
          <p className="v5-micro">{c.label.product}</p>
          <h1 id="page-title" tabIndex={-1}>
            {c.results.title}
          </h1>
          <p className="v5-muted">
            <span className="v5-micro v5-inline">{c.label.profile}</span> {demo.profileLine}
          </p>
        </div>
        <Counter counter={demo.proposals.counter} limit={MONTHLY_PROPOSAL_LIMIT} left={left(demo.proposals)} />
      </header>

      <p className="sr-only" role="status" aria-live="polite">
        {msg}
      </p>

      <div className="v5-split">
        <div className="v5-master">
          <div className="v5-master-head">
            <p className="v5-micro">{c.results.count(matches.length)}</p>
            <p className="v5-micro v5-hint">{c.results.listHint}</p>
          </div>
          <ol className="v5-list" aria-label={c.results.listLabel}>
            {matches.map((m, i) => {
              const on = current?.item.id === m.item.id;
              const sent = isSent(demo.proposals, m.item.id);
              return (
                <li key={m.item.id} className={on ? 'is-on' : undefined}>
                  <button
                    type="button"
                    className="v5-row"
                    ref={(el) => {
                      btns.current[i] = el;
                    }}
                    aria-current={on ? 'true' : undefined}
                    onClick={() => select(i)}
                    onKeyDown={(ev) => onKey(ev, i)}
                  >
                    <span className="v5-row-idx" aria-hidden="true">
                      {pad2(i + 1)}
                    </span>
                    <span className="v5-row-main">
                      <span className="v5-row-name">{m.item.nome}</span>
                      <span className="v5-row-sub">
                        {L.tipo[m.item.tipo]}
                        {sent && <span className="v5-row-sent"> · {c.results.proposedTag}</span>}
                      </span>
                    </span>
                    <span className="v5-row-score">
                      <span className="v5-row-num">{m.evaluation.score}</span>
                      <span className="v5-row-band">{scoreBand(m.evaluation.score, locale).label}</span>
                    </span>
                  </button>
                  {on && <Detail m={m} proposals={demo.proposals} onPropose={onPropose} where="inline" />}
                </li>
              );
            })}
          </ol>
        </div>
        <div className="v5-side" aria-label={c.results.detailLabel} role="region">
          {current && <Detail m={current} proposals={demo.proposals} onPropose={onPropose} where="side" />}
        </div>
      </div>

      {demo.excluded.length > 0 && (
        <details className="v5-excluded">
          <summary>{t.match.ui.excluded.investors(demo.excluded.length)}</summary>
          <ul>
            {demo.excluded.map((x) => (
              <li key={x.item.id}>
                <span className="v5-ex-name">{x.item.nome}</span>
                <span className="v5-ex-why">{x.evaluation.whyNot.join(' · ')}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
