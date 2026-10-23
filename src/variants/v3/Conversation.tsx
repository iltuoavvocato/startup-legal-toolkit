// V3 chat panel: message log (role="log"), sticky quick-reply chips, scroll and focus handling.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useI18n } from '../../i18n/context';
import type { AgentBody, ChatState, Chip } from './chat';
import { chipsFor } from './chat';
import { AgentBubble, Avatar, UserBubble } from './parts';

export interface RenderedAgent {
  content: ReactNode;
  wide?: boolean;
}

interface Props {
  state: ChatState;
  onChip: (chip: Chip) => void;
  renderAgent: (body: AgentBody) => RenderedAgent;
  chipLabel: (chip: Chip) => string;
  /** Short status line in the chat header (progress). */
  status: ReactNode;
}

const PRIMARY: readonly Chip[] = ['propose', 'interested', 'simulate'];

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function Conversation({ state, onChip, renderAgent, chipLabel, status }: Props) {
  const { t } = useI18n();
  const c = t.variants.v3;
  // Messages present at first render are never animated nor scrolled to.
  const [firstMax] = useState(() => Math.max(0, ...state.messages.map((m) => m.id)));
  const interacted = useRef(false);
  const lastSeen = useRef(firstMax);
  const chipsRef = useRef<HTMLDivElement>(null);
  const chips = chipsFor(state);

  useLayoutEffect(() => {
    const prev = lastSeen.current;
    lastSeen.current = Math.max(prev, ...state.messages.map((m) => m.id));
    if (!interacted.current) return;
    const first = state.messages.find((m) => m.id > prev);
    const el = first && document.getElementById(`v3-m-${first.id}`);
    const bar = chipsRef.current;
    if (!el || !bar) return;
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
    // Show the new messages together with the chips; if they don't fit, start from the first new message.
    const span = bar.getBoundingClientRect().bottom - el.getBoundingClientRect().top;
    if (span <= window.innerHeight - 110) bar.scrollIntoView({ block: 'end', behavior });
    else el.scrollIntoView({ block: 'start', behavior });
  }, [state.messages]);

  useEffect(() => {
    // The pressed chip usually disappears: keep keyboard focus inside the chip bar.
    if (!interacted.current) return;
    const active = document.activeElement;
    if (!active || active === document.body || !chipsRef.current?.contains(active)) {
      chipsRef.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    }
  }, [state.messages]);

  const press = (chip: Chip) => {
    interacted.current = true;
    onChip(chip);
  };

  return (
    <section className="v3-chat" aria-label={c.logLabel}>
      <header className="v3-chat-head">
        <Avatar small />
        <div className="v3-chat-who">
          <p className="v3-chat-name">{c.agentName}</p>
          <p className="v3-chat-role">{c.agentRole}</p>
        </div>
        <p className="v3-chat-status">{status}</p>
      </header>
      <ol className="v3-log" role="log" aria-live="polite" aria-relevant="additions" aria-label={c.logLabel}>
        {state.messages.map((m, k) => {
          const isNew = m.id > firstMax;
          const id = `v3-m-${m.id}`;
          if (m.from === 'user') {
            return (
              <UserBubble key={m.id} id={id} isNew={isNew}>
                {chipLabel(m.chip)}
              </UserBubble>
            );
          }
          const prev = state.messages[k - 1];
          const r = renderAgent(m.body);
          return (
            <AgentBubble key={m.id} id={id} isNew={isNew} continued={prev?.from === 'agent'} wide={r.wide}>
              {r.content}
            </AgentBubble>
          );
        })}
      </ol>
      <div className="v3-chips" ref={chipsRef} role="group" aria-label={c.chipsLabel}>
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            className={`v3-chip${PRIMARY.includes(chip) ? ' is-primary' : ''}${chip === 'restart' ? ' is-quiet' : ''}`}
            onClick={() => press(chip)}
          >
            {chipLabel(chip)}
          </button>
        ))}
      </div>
    </section>
  );
}
