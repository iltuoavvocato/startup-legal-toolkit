import { useState, type FormEvent, type ReactNode } from 'react';
import { useI18n } from '../../../i18n/context';
import { toOneLiner } from '../../../lib/deck';
import {
  answerText,
  ITALIA,
  questionSpec,
  roundSuggestions,
  ticketSuggestions,
  type Action,
  type AgentBody,
  type AnswerValue,
  type IntakeState,
  type Range,
} from '../../../lib/intakeAgent';
import { ONE_LINER_MAX } from '../../../lib/matchTaxonomy';

type Ask = AgentBody & { kind: 'ask' };

interface Props {
  state: IntakeState;
  ask: Ask;
  /** Id of the question bubble: labels the answer controls. */
  questionId: string;
  dispatch: (a: Action) => void;
  /** Deck question: "Scegli il PDF" and "Prova con un deck di esempio". */
  deckButtons: ReactNode;
}

/** Answer controls for the open question: chips (buttons), amounts, a short text, or the deck choice. */
export function AgentComposer({ state, ask, questionId, dispatch, deckButtons }: Props) {
  const { locale, t, f } = useI18n();
  const u = t.intake.ui;
  const q = ask.q;
  const spec = questionSpec(q);
  const a = state.answers;
  const answer = (value: unknown) => dispatch({ type: 'ANSWER', value: value as AnswerValue });

  // Prefill when editing, or with the deck's value after "Modifica".
  const [multi, setMulti] = useState<string[]>(() => {
    if (q === 'settori') return a.settori ?? [];
    if (q === 'fasi') return a.fasi ?? [];
    if (q === 'aree') return a.aree === 'italia' ? [ITALIA] : (a.aree ?? []);
    return [];
  });
  const [amount, setAmount] = useState<number | null>(() =>
    q === 'round' ? (a.round ?? (typeof ask.suggested === 'number' ? ask.suggested : null)) : null,
  );
  const [range, setRange] = useState<{ min: number | null; max: number | null }>(() => ({
    min: a.ticket?.min ?? null,
    max: a.ticket?.max ?? null,
  }));
  const [text, setText] = useState(() => {
    if (q !== 'oneLiner') return '';
    if (a.oneLiner) return a.oneLiner;
    const tagline = state.deck.decisions.oneLiner === 'edit' ? state.deck.findings?.tagline?.value : undefined;
    return tagline ? toOneLiner(tagline) : '';
  });

  const label = (value: string): string => {
    if (spec.kind === 'multi') return answerText(q, [value], locale);
    return answerText(q, value, locale);
  };
  const current = (value: string): boolean => {
    const v = (a as Record<string, unknown>)[q];
    return v === value;
  };

  const toggle = (value: string) => {
    setMulti((sel) => {
      if (sel.includes(value)) return sel.filter((v) => v !== value);
      if (spec.exclusive && value === spec.exclusive) return [value];
      return [...sel.filter((v) => v !== spec.exclusive), value];
    });
  };

  const submit = (e: FormEvent, value: unknown) => {
    e.preventDefault();
    answer(value);
  };

  const chip = (value: string, opts: { primary?: boolean; onClick?: () => void; children?: ReactNode } = {}) => (
    <button
      key={value}
      type="button"
      className={`mi-agent-chip${opts.primary ? ' is-primary' : ''}${current(value) ? ' is-current' : ''}${ask.suggested === value ? ' is-suggested' : ''}`}
      onClick={opts.onClick ?? (() => answer(value))}
    >
      {opts.children ?? label(value)}
      {ask.suggested === value && <span className="mi-agent-tag">{u.suggestedTag}</span>}
    </button>
  );

  let body: ReactNode;
  switch (spec.kind) {
    case 'deck':
      body = (
        <div className="mi-agent-chips">
          {deckButtons}
          {chip('skip', { children: t.intake.choices.deck.skip })}
        </div>
      );
      break;
    case 'single':
    case 'choice':
      body = (
        <div className={`mi-agent-chips${spec.options.length > 12 ? ' is-many' : ''}`}>
          {spec.options.map((o) => chip(o, { primary: spec.kind === 'choice' && (o === 'accept' || o === 'ok') }))}
          {spec.optional && (
            <button type="button" className="mi-agent-chip is-quiet" onClick={() => dispatch({ type: 'SKIP' })}>
              {u.skip}
            </button>
          )}
        </div>
      );
      break;
    case 'confirm':
      body = (
        <div className="mi-agent-chips">
          <button type="button" className="btn btn-navy" onClick={() => answer('go')}>
            {t.intake.choices.confirm.go} <span aria-hidden="true">→</span>
          </button>
        </div>
      );
      break;
    case 'multi':
      body = (
        <form onSubmit={(e) => submit(e, multi)}>
          <div className="mi-agent-chips">
            {spec.options.map((o) => (
              <button
                key={o}
                type="button"
                aria-pressed={multi.includes(o)}
                className={`mi-agent-chip is-toggle${multi.includes(o) ? ' is-on' : ''}`}
                onClick={() => toggle(o)}
              >
                <span className="mi-agent-check" aria-hidden="true" />
                {o === ITALIA ? t.match.taxonomy.allItaly : label(o)}
                {multi[0] === o && q !== 'aree' && multi.length > 1 && <span className="mi-agent-tag" aria-hidden="true">1°</span>}
              </button>
            ))}
          </div>
          <div className="mi-agent-submit">
            <span className="field-hint">{u.selected(multi.length)}</span>
            <button type="submit" className="btn btn-navy btn-sm">
              {u.confirmChoice}
            </button>
          </div>
        </form>
      );
      break;
    case 'amount': {
      const suggestions = roundSuggestions(ask.fase);
      body = (
        <form onSubmit={(e) => submit(e, amount)}>
          <div className="mi-agent-chips">
            {suggestions.map((n) => chip(String(n), { onClick: () => answer(n), children: f.euro(n) }))}
          </div>
          <AmountInput id={`${questionId}-amount`} label={u.amountLabel} value={amount} onChange={setAmount} />
          <div className="mi-agent-submit">
            <span />
            <button type="submit" className="btn btn-navy btn-sm">
              {u.send}
            </button>
          </div>
        </form>
      );
      break;
    }
    case 'range': {
      const suggestions = ticketSuggestions(ask.fasi);
      body = (
        <form onSubmit={(e) => submit(e, range)}>
          <div className="mi-agent-chips">
            {suggestions.map((r: Range) => (
              <button key={`${r.min}-${r.max}`} type="button" className="mi-agent-chip" onClick={() => answer(r)}>
                {t.intake.range(f.euro(r.min), f.euro(r.max))}
              </button>
            ))}
          </div>
          <div className="mi-agent-range">
            <AmountInput id={`${questionId}-min`} label={u.minLabel} value={range.min} onChange={(v) => setRange((x) => ({ ...x, min: v }))} />
            <AmountInput id={`${questionId}-max`} label={u.maxLabel} value={range.max} onChange={(v) => setRange((x) => ({ ...x, max: v }))} />
          </div>
          <div className="mi-agent-submit">
            <span />
            <button type="submit" className="btn btn-navy btn-sm">
              {u.send}
            </button>
          </div>
        </form>
      );
      break;
    }
    case 'text':
      body = (
        <form onSubmit={(e) => submit(e, text)}>
          <div className="field mi-field">
            <label htmlFor={`${questionId}-text`} className="sr-only">
              {u.textLabel}
            </label>
            <textarea
              id={`${questionId}-text`}
              className="mi-textarea mi-agent-textarea"
              maxLength={ONE_LINER_MAX}
              value={text}
              aria-describedby={`${questionId}-count`}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="mi-agent-submit">
            <span className="field-hint" id={`${questionId}-count`}>
              {u.textCount(text.length, ONE_LINER_MAX)}
            </span>
            <span className="mi-agent-submit-buttons">
              <button type="button" className="btn btn-text btn-sm" onClick={() => dispatch({ type: 'SKIP' })}>
                {u.skip}
              </button>
              <button type="submit" className="btn btn-navy btn-sm">
                {u.send}
              </button>
            </span>
          </div>
        </form>
      );
      break;
  }

  return (
    <div className="mi-agent-answer" role="group" aria-labelledby={questionId} data-q={q}>
      {body}
      {state.error && (
        <p className="mi-error mi-agent-error" role="alert">
          {u.errors[state.error]}
        </p>
      )}
    </div>
  );
}

function AmountInput({ id, label, value, onChange }: { id: string; label: string; value: number | null; onChange: (v: number | null) => void }) {
  const { t, f } = useI18n();
  return (
    <div className="field mi-field mi-agent-amount">
      <label htmlFor={id}>{label}</label>
      <div className="input-affix">
        <span aria-hidden="true">€</span>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={1}
          step={1000}
          value={value ?? ''}
          aria-describedby={value ? `${id}-read` : undefined}
          onChange={(e) => {
            const n = Math.round(Number(e.target.value));
            onChange(e.target.value === '' || !Number.isFinite(n) ? null : Math.max(0, n));
          }}
        />
      </div>
      {value !== null && value > 0 && (
        <p className="field-hint mi-amount" id={`${id}-read`}>
          {t.intake.ui.amountRead(f.euro(value))}
        </p>
      )}
    </div>
  );
}
