import { useEffect, useState } from 'react';
import type { Message } from '../../../lib/intakeAgent';

function usePrefersReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && Boolean(window.matchMedia?.(query).matches));
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** Pause before an agent message appears: longer for longer messages, short for match cards. */
function delayFor(m: Message, textLength: number): number {
  if (m.from === 'user') return 0;
  if (m.body.kind === 'match') return 280;
  return Math.min(1100, Math.max(450, 300 + textLength * 6));
}

/**
 * "Typing" animation: new agent messages appear one at a time after a short pause. Messages present on the first
 * render (a restored conversation) appear at once, and so does everything with prefers-reduced-motion or once the
 * user chose "Salta l'animazione".
 */
export function useReveal(messages: readonly Message[], textOf: (m: Message) => string) {
  const reducedMotion = usePrefersReducedMotion();
  const [skipped, setSkipped] = useState(false);
  const lastId = messages.length ? messages[messages.length - 1]!.id : 0;
  const [shown, setShown] = useState(lastId);
  const instant = reducedMotion || skipped;
  // After "Ricomincia" the ids start again from 1: everything at or below `shown` is visible at once.
  const next = messages.find((m) => m.id > shown);

  useEffect(() => {
    if (!next) return;
    if (instant || next.from === 'user') {
      setShown(instant ? lastId : next.id);
      return;
    }
    const timer = window.setTimeout(() => setShown(next.id), delayFor(next, textOf(next).length));
    return () => window.clearTimeout(timer);
    // textOf is stable per render language; the next message id drives the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [next?.id, instant, lastId]);

  useEffect(() => {
    if (lastId < shown) setShown(lastId);
  }, [lastId, shown]);

  const visible = next && !instant ? messages.filter((m) => m.id <= shown) : messages;
  return {
    visible,
    /** Agent messages still to appear. */
    typing: Boolean(next) && !instant,
    done: !next || instant,
    skip: () => setSkipped(true),
    skipped,
  };
}
