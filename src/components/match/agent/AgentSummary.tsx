import { useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '../../../i18n/context';
import { progress, signalText, startupProfileOf, summaryRows, type Action, type IntakeState } from '../../../lib/intakeAgent';
import { teaserOf } from '../../../lib/optin';
import { TeaserCard } from '../TeaserCard';

interface Props {
  state: IntakeState;
  dispatch: (a: Action) => void;
  /** Incremented to open the panel and focus its first "Modifica". */
  focusSignal: number;
}

/** Live profile (founder) or thesis (investor): a side panel on desktop, a collapsible bar on phones. */
export function AgentSummary({ state, dispatch, focusSignal }: Props) {
  const { locale, t } = useI18n();
  const u = t.intake.ui;
  const side = state.mode === 'startup' ? u.startup : u.investor;
  const [open, setOpen] = useState(false);
  const id = useId();
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focusSignal) return;
    setOpen(true);
    // After the panel has opened.
    window.setTimeout(() => bodyRef.current?.querySelector<HTMLElement>('.mi-agent-edit')?.focus(), 0);
  }, [focusSignal]);
  const rows = summaryRows(state, locale);
  const { done, total } = progress(state);
  const profile = state.mode === 'startup' ? startupProfileOf(state, locale) : null;

  return (
    <aside className="mi-agent-side" aria-labelledby={`${id}-title`}>
      <div className="mi-agent-side-head">
        <h2 id={`${id}-title`} className="mi-agent-side-title">
          {side.summaryTitle}
        </h2>
        <span className="mi-agent-side-progress">{u.progress(done, total)}</span>
        <button
          type="button"
          className="btn btn-text btn-sm mi-agent-side-toggle"
          aria-expanded={open}
          aria-controls={`${id}-body`}
          onClick={() => setOpen((o) => !o)}
        >
          {u.summaryToggle}
          <span aria-hidden="true" className="mi-agent-chevron" />
        </button>
      </div>
      <div id={`${id}-body`} ref={bodyRef} className={`mi-agent-side-body${open ? ' is-open' : ''}`}>
        <p className="mi-agent-side-note">{side.summaryNote}</p>
        <dl className="mi-agent-facts">
          {rows.map((r) => (
            <div key={r.key} className={r.value ? 'is-set' : undefined}>
              <dt>{u.labels[r.key]}</dt>
              <dd>
                <span className={r.value ? 'mi-agent-fact-value' : 'mi-agent-fact-empty'}>
                  {r.value ?? (r.skipped ? u.skipped : u.empty)}
                </span>
                {r.value && <span className="mi-agent-source">{r.page ? u.fromDeck(r.page) : u.fromYou}</span>}
              </dd>
              {r.edit && (
                // In its own <dd>: a <dl> group may only hold <dt>/<dd> children.
                <dd className="mi-agent-fact-edit">
                  <button type="button" className="btn btn-text btn-sm mi-agent-edit" onClick={() => dispatch({ type: 'EDIT', q: r.edit! })}>
                    {u.edit}
                    <span className="sr-only">{u.editSr(u.labels[r.key])}</span>
                  </button>
                </dd>
              )}
            </div>
          ))}
        </dl>
        {state.deck.signals.length > 0 && (
          <p className="mi-agent-side-note">{u.signalsNote(state.deck.signals.map((x) => signalText(x, locale)).join(' · '))}</p>
        )}
        {profile && <TeaserCard teaser={teaserOf(profile, locale)} label={t.match.ui.startup.previewLabel} />}
      </div>
    </aside>
  );
}
