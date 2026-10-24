import { useEffect, useRef, useState, type DragEvent, type MutableRefObject } from 'react';
import { demoInvestors, demoStartups } from '../../../data/matchDemo';
import { useI18n } from '../../../i18n/context';
import { validateDeck } from '../../../lib/deck';
import { confidenceBand } from '../../../lib/deckExtract';
import {
  answerText,
  EDITABLE,
  investorProfileOf,
  messageText,
  plan,
  progress,
  signalText,
  startupProfileOf,
  type Action,
  type AgentBody,
  type IntakeState,
  type Message,
  type QuestionId,
} from '../../../lib/intakeAgent';
import { matchInvestors, matchStartups } from '../../../lib/matching';
import { labelsFor } from '../../../lib/matchTaxonomy';
import { proposalCounter } from '../../../lib/inbox';
import { MONTHLY_PROPOSAL_LIMIT, remaining } from '../../../lib/optin';
import { ExportLink } from '../ExportLink';
import { LockIcon } from '../TeaserCard';
import { useInbox } from '../useInbox';
import type { DeckReadState } from '../useDeckReader';
import { AgentComposer } from './AgentComposer';
import { AgentMatch } from './AgentMatch';
import { useReveal } from './useReveal';

interface Props {
  state: IntakeState;
  dispatch: (a: Action) => void;
  read: DeckReadState;
  onDeckFile: (file: File) => void;
  onRestart: () => void;
  /** Opens the profile panel and moves focus there (its "Modifica" buttons reopen a question). */
  onEditProfile: () => void;
  /** Set once the user has acted: only then does focus follow the conversation. */
  interacted: MutableRefObject<boolean>;
}

/** The chat: transcript (role="log"), typing indicator, answer controls and deck drop. */
export function AgentConversation({ state, dispatch, read, onDeckFile, onRestart, onEditProfile, interacted }: Props) {
  const { locale, t } = useI18n();
  const u = t.intake.ui;
  const textOf = (m: Message) => messageText(m, state.mode, locale);
  const reveal = useReveal(state.messages, textOf);
  const fileInput = useRef<HTMLInputElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const [dragging, setDragging] = useState(false);

  const act = (a: Action) => {
    interacted.current = true;
    setFileError(null);
    dispatch(a);
  };

  const canAddDeck = state.mode === 'startup' && state.phase === 'intake' && state.deck.status !== 'reading' && state.deck.status !== 'read';

  const pick = (file: File | undefined) => {
    if (!file) return;
    interacted.current = true;
    const problem = validateDeck({ name: file.name, type: file.type, size: file.size }, locale);
    setFileError(problem);
    if (!problem) onDeckFile(file);
  };

  const trySample = async () => {
    const d = t.match.ui.dropzone;
    setLoadingSample(true);
    setFileError(null);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}demo/${d.sampleFile}`);
      if (!res.ok) throw new Error(String(res.status));
      pick(new File([await res.blob()], d.sampleFile, { type: 'application/pdf' }));
    } catch {
      setFileError(d.sampleError);
    } finally {
      setLoadingSample(false);
    }
  };

  // The question on screen is the last "ask" message (once it has appeared).
  const lastAsk = [...reveal.visible].reverse().find((m) => m.from === 'agent' && m.body.kind === 'ask');
  const showAnswer = reveal.done && state.current !== null && lastAsk !== undefined;
  const lastId = state.messages.length ? state.messages[state.messages.length - 1]!.id : 0;

  // Focus: after the user acts, move to the new question's first control, or to the results once they appear.
  useEffect(() => {
    if (!interacted.current || !reveal.done) return;
    if (state.current) {
      answerRef.current?.querySelector<HTMLElement>('button, input, textarea')?.focus();
    } else if (state.phase === 'results') {
      const results = [...state.messages].reverse().find((m) => m.body.kind === 'results');
      if (results && state.messages[state.messages.length - 1]!.body.kind === 'wrap') {
        document.getElementById(`mi-m-${results.id}`)?.focus();
      }
    }
    // Runs when a new message arrives or the reveal finishes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastId, reveal.done]);

  // Latest answer per question: only that bubble offers "Modifica".
  const latestAnswer = new Map<QuestionId, number>();
  for (const m of state.messages) if (m.from === 'user' && m.body.kind === 'answer') latestAnswer.set(m.body.q, m.id);
  const inPlan = plan(state);
  const editable = (q: QuestionId, id: number) =>
    EDITABLE.includes(q) && latestAnswer.get(q) === id && state.deck.status !== 'reading' && inPlan.includes(q) && state.current !== q;
  const canBack = state.messages.some((m) => m.from === 'user' && m.body.kind === 'answer' && editable(m.body.q, m.id));

  const { done, total } = progress(state);
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (canAddDeck) pick(e.dataTransfer.files[0]);
  };

  const deckButtons = (
    <>
      <button type="button" className="mi-agent-chip is-primary" onClick={() => fileInput.current?.click()}>
        {u.pickDeck}
      </button>
      <button type="button" className="mi-agent-chip" onClick={trySample} disabled={loadingSample}>
        {u.sampleDeck}
      </button>
    </>
  );

  return (
    <section
      className={`mi-agent-chat${dragging ? ' is-dragging' : ''}`}
      aria-label={u.logLabel}
      onDragOver={(e) => {
        if (!canAddDeck) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <header className="mi-agent-head">
        <span className="mi-agent-avatar" aria-hidden="true">
          M
        </span>
        <div className="mi-agent-who">
          <p className="mi-agent-name">{u.agentName}</p>
          <p className="mi-agent-role">{u.agentRole}</p>
        </div>
        <div className="mi-agent-tools">
          <span className="mi-agent-progress">{state.phase === 'results' ? '' : u.progress(done, total)}</span>
          <button type="button" className="btn btn-text btn-sm" onClick={onRestart}>
            {u.restart}
          </button>
        </div>
      </header>

      <div className="mi-agent-log-wrap" role="log" aria-live="polite" aria-relevant="additions" aria-label={u.logLabel}>
        <ol className="mi-agent-log">
          {reveal.visible.map((m, k) => {
            const prev = reveal.visible[k - 1];
            const elId = `mi-m-${m.id}`;
            if (m.from === 'user') {
              const q = m.body.kind === 'answer' ? m.body.q : null;
              return (
                <li key={m.id} id={elId} className="mi-msg is-user">
                  <div className="mi-bubble">
                    <span className="sr-only">{u.you}: </span>
                    {textOf(m)}
                  </div>
                  {q && editable(q, m.id) && (
                    <button type="button" className="btn btn-text btn-sm mi-agent-edit" onClick={() => act({ type: 'EDIT', q })}>
                      {u.edit}
                      <span className="sr-only">{u.editSr(u.labels[q as keyof typeof u.labels] ?? textOf(m))}</span>
                    </button>
                  )}
                </li>
              );
            }
            const continued = prev?.from === 'agent';
            return (
              <li key={m.id} className={`mi-msg is-agent${continued ? ' is-continued' : ''}${m.body.kind === 'match' ? ' is-wide' : ''}`}>
                {!continued && (
                  <span className="mi-agent-avatar is-small" aria-hidden="true">
                    M
                  </span>
                )}
                <AgentContent m={m} body={m.body} elId={elId} state={state} dispatch={act} />
              </li>
            );
          })}
        </ol>
      </div>

      {reveal.typing && (
        <div className="mi-agent-typing">
          <span className="mi-agent-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="mi-agent-typing-text">{u.typing}</span>
          <button type="button" className="btn btn-text btn-sm" onClick={reveal.skip}>
            {u.skipAnimation}
          </button>
        </div>
      )}

      <div className="mi-agent-composer" ref={answerRef}>
        {state.deck.status === 'reading' && (
          <p className="mi-agent-reading" role="status">
            {read.status === 'reading' ? u.reading(read.page, read.total) : u.readingStart}
          </p>
        )}
        {showAnswer && lastAsk && lastAsk.from === 'agent' && lastAsk.body.kind === 'ask' && (
          <AgentComposer
            key={lastAsk.id}
            state={state}
            ask={lastAsk.body}
            questionId={`mi-q-${lastAsk.id}`}
            dispatch={act}
            deckButtons={deckButtons}
          />
        )}
        {fileError && (
          <p className="mi-error mi-agent-error" role="alert">
            {fileError}
          </p>
        )}
        {reveal.done && state.phase === 'results' && (
          <div className="mi-agent-chips">
            {state.messages.some((m) => m.body.kind === 'wrap' && m.body.excluded > 0) &&
              !state.messages.some((m) => m.body.kind === 'excluded') && (
                <button type="button" className="mi-agent-chip" onClick={() => act({ type: 'SHOW_EXCLUDED' })}>
                  {u.actions.excluded}
                </button>
              )}
            <button type="button" className="mi-agent-chip" onClick={onEditProfile}>
              {state.mode === 'startup' ? u.actions.editProfile : u.actions.editThesis}
            </button>
          </div>
        )}
        {reveal.done && (canBack || canAddDeck) && state.current !== 'deck' && state.phase === 'intake' && (
          <div className="mi-agent-foot">
            {canBack && (
              <button type="button" className="btn btn-text btn-sm" onClick={() => act({ type: 'BACK' })}>
                <span aria-hidden="true">←</span> {u.back}
              </button>
            )}
            {canAddDeck && (
              <button type="button" className="btn btn-text btn-sm mi-agent-attach" onClick={() => fileInput.current?.click()}>
                <span aria-hidden="true">+</span> {u.attach}
              </button>
            )}
          </div>
        )}
        {canAddDeck && (
          <p className="mi-agent-privacy">
            <LockIcon />
            <span>{u.attachHint}</span>
          </p>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
      {dragging && (
        <div className="mi-agent-drop" aria-hidden="true">
          {u.dropHere}
        </div>
      )}
    </section>
  );
}

interface ContentProps {
  m: Message;
  body: AgentBody;
  elId: string;
  state: IntakeState;
  dispatch: (a: Action) => void;
}

function AgentContent({ m, body, elId, state, dispatch }: ContentProps) {
  const { locale, t } = useI18n();
  const u = t.intake.ui;
  const Q = t.intake.questions;
  const inbox = useInbox();
  const text = messageText(m, state.mode, locale);

  if (body.kind === 'match') {
    return (
      <div className="mi-bubble is-card" id={elId}>
        <AgentMatch state={state} id={body.id} rank={body.rank} dispatch={dispatch} />
      </div>
    );
  }

  if (body.kind === 'ask') {
    const f = body.finding;
    return (
      <div className="mi-bubble" id={elId}>
        <p id={`mi-q-${m.id}`}>{text}</p>
        {f && f.key !== 'extras' && (
          <figure className="mi-agent-quote">
            {f.key === 'oneLiner' ? (
              f.value ? <blockquote>{String(f.value)}</blockquote> : <p className="mi-muted">{Q.notKept}</p>
            ) : f.snippet ? (
              <blockquote>{f.snippet}</blockquote>
            ) : null}
            <figcaption>
              {Q.quoteLabel(f.page)} · {Q.confidence[confidenceBand(f.confidence)]}
            </figcaption>
          </figure>
        )}
        {f?.conflict !== undefined && f.key !== 'extras' && f.key !== 'oneLiner' && (
          <p className="mi-agent-note">{Q.conflict(answerText(f.key, f.conflict, locale))}</p>
        )}
        {f?.currency && <p className="mi-agent-note">{Q.currency(f.currency)}</p>}
      </div>
    );
  }

  if (body.kind === 'results') {
    const left = remaining(proposalCounter(inbox.store, inbox.now), MONTHLY_PROPOSAL_LIMIT);
    return (
      <div className="mi-bubble" id={elId} tabIndex={-1}>
        <p>{text}</p>
        {state.mode === 'startup' && body.signals > 0 && state.deck.signals.length > 0 && (
          <p>{u.signalsNote(state.deck.signals.map((x) => signalText(x, locale)).join(' · '))}</p>
        )}
        {state.mode === 'startup' && body.count > 0 && <p className="mi-agent-note">{u.proposalsLeft(left, MONTHLY_PROPOSAL_LIMIT)}</p>}
        <p className="mi-agent-note">{t.match.demoLabel}</p>
        <p className="mi-agent-export">
          <ExportLink kind={state.mode} />
        </p>
      </div>
    );
  }

  if (body.kind === 'excluded') {
    return (
      <div className="mi-bubble" id={elId}>
        <p>{text}</p>
        <ExcludedLines state={state} />
      </div>
    );
  }

  return (
    <div className="mi-bubble" id={elId}>
      <p>{text}</p>
    </div>
  );
}

function ExcludedLines({ state }: { state: IntakeState }) {
  const { locale, t } = useI18n();
  const L = labelsFor(locale);
  let rows: { id: string; name: string; why: string[] }[] = [];
  if (state.mode === 'startup') {
    const p = startupProfileOf(state, locale);
    if (p) rows = matchInvestors(p, demoInvestors(locale), locale).excluded.map((x) => ({ id: x.item.id, name: x.item.nome, why: x.evaluation.whyNot }));
  } else {
    const i = investorProfileOf(state, locale);
    if (i)
      rows = matchStartups(i, demoStartups(locale), locale).excluded.map((x) => ({
        id: x.item.id,
        name: t.match.ui.investor.startupTitle(L.settore[x.item.settore], L.regione[x.item.regione]),
        why: x.evaluation.whyNot,
      }));
  }
  return (
    <ul className="mi-agent-excluded">
      {rows.map((r) => (
        <li key={r.id}>
          <strong>{r.name}</strong>: {r.why.join('; ')}
        </li>
      ))}
    </ul>
  );
}
