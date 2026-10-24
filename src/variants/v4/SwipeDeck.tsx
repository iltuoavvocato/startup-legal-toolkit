// V4: the swipe deck. One card on top, the next ones peeking behind, Pass / Interested buttons (the accessible path),
// pointer drag with tilt, arrow keys while the screen is mounted, undo.
import { useCallback, useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { useI18n } from '../../i18n/context';
import { isDone, progress, stack, swipeDecision, type Decision, type DeckState } from '../logic/deck';
import { deckKey, position, swipeIntensity, tiltFor } from './swipe';

const FLY_MS = 240;
const DRAG_START = 6;

function reducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface Props {
  deck: DeckState;
  /** Card content; `top` is false for the card peeking behind (rendered inert and hidden from AT). */
  renderCard: (id: string, top: boolean) => ReactNode;
  onDecide: (d: Decision) => void;
  onUndo: () => void;
  canUndo: boolean;
  /** Shown instead of a usable undo when the last decision can't be withdrawn. */
  undoLockedNote?: string | null;
  interestedDisabled?: boolean;
  /** Explains why Interested is disabled; also announced when someone tries anyway. */
  interestedNote?: string | null;
  onBlocked?: () => void;
  interestedLabel?: string;
  /** Rendered in place of the cards when the deck is finished. */
  done: ReactNode;
  size?: 'full' | 'mini';
}

export function SwipeDeck({
  deck,
  renderCard,
  onDecide,
  onUndo,
  canUndo,
  undoLockedNote,
  interestedDisabled = false,
  interestedNote,
  onBlocked,
  interestedLabel,
  done,
  size = 'full',
}: Props) {
  const { t } = useI18n();
  const a = t.variants.actions;
  const c = t.variants.v4.deck;
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [fly, setFly] = useState<Decision | null>(null);
  const drag = useRef<{ id: number; x: number; active: boolean } | null>(null);
  const timer = useRef<number | null>(null);
  const finished = isDone(deck);
  const total = deck.ids.length;
  const noteId = useId();

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const request = useCallback(
    (d: Decision) => {
      if (fly || isDone(deck)) return;
      if (d === 'interested' && interestedDisabled) {
        setDx(0);
        onBlocked?.();
        return;
      }
      if (reducedMotion()) {
        setDx(0);
        onDecide(d);
        return;
      }
      setFly(d);
      timer.current = window.setTimeout(() => {
        timer.current = null;
        setFly(null);
        setDx(0);
        onDecide(d);
      }, FLY_MS);
    },
    [fly, deck, interestedDisabled, onBlocked, onDecide],
  );

  const requestUndo = useCallback(() => {
    if (fly || !canUndo) return;
    onUndo();
  }, [fly, canUndo, onUndo]);

  // Keyboard: only while mounted; ignored in form fields and with modifier keys.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const action = deckKey(e, document.activeElement as HTMLElement | null);
      if (!action) return;
      if (action === 'undo') {
        if (!canUndo) return;
        e.preventDefault();
        requestUndo();
        return;
      }
      if (isDone(deck)) return;
      e.preventDefault();
      request(action);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deck, canUndo, request, requestUndo]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (fly || e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, a, summary, input, select, textarea')) return;
    drag.current = { id: e.pointerId, x: e.clientX, active: false };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = drag.current;
    if (!g || g.id !== e.pointerId) return;
    const delta = e.clientX - g.x;
    if (!g.active) {
      if (Math.abs(delta) < DRAG_START) return;
      g.active = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    setDx(delta);
  };
  const endDrag = (e: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const g = drag.current;
    if (!g || g.id !== e.pointerId) return;
    drag.current = null;
    if (!g.active) return;
    setDragging(false);
    const d = cancelled ? null : swipeDecision(e.clientX - g.x);
    if (d) request(d);
    else setDx(0);
  };

  const cards = finished ? [] : stack(deck, 3);
  const hint: Decision | null = fly ?? (dx > 0 ? 'interested' : dx < 0 ? 'pass' : null);
  const strength = fly ? 1 : swipeIntensity(dx);
  const topTransform = fly
    ? `translateX(${fly === 'interested' ? 130 : -130}%) rotate(${fly === 'interested' ? 16 : -16}deg)`
    : `translateX(${dx}px) rotate(${tiltFor(dx)}deg)`;
  const pos = position(deck);

  return (
    <div className={`v4-deck v4-deck-${size}`}>
      <div className="v4-progress">
        <p className="v4-progress-text" aria-hidden="true">
          {finished ? c.progress(total, total) : c.progress(pos, total)}
        </p>
        <div
          className="v4-progress-bar"
          role="progressbar"
          aria-label={c.progressLabel}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={deck.index}
          aria-valuetext={finished ? c.progress(total, total) : c.cardOf(pos, total)}
        >
          <span style={{ width: `${Math.round(progress(deck) * 100)}%` }} />
        </div>
      </div>

      {finished ? (
        <div className="v4-done">{done}</div>
      ) : (
        <div className="v4-stage" role="group" aria-roledescription={c.region} aria-label={c.cardOf(pos, total)}>
          {cards
            .map((id, i) => ({ id, i }))
            .reverse()
            .map(({ id, i }) =>
              i === 0 ? (
                <div
                  key={id}
                  className={`v4-slot v4-slot-top${dragging ? ' is-dragging' : ''}${fly ? ' is-flying' : ''}`}
                  style={{ transform: topTransform }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={(e) => endDrag(e, false)}
                  onPointerCancel={(e) => endDrag(e, true)}
                >
                  {renderCard(id, true)}
                  <span className="v4-stamp v4-stamp-yes" aria-hidden="true" style={{ opacity: hint === 'interested' ? strength : 0 }}>
                    {interestedLabel ?? a.interested}
                  </span>
                  <span className="v4-stamp v4-stamp-no" aria-hidden="true" style={{ opacity: hint === 'pass' ? strength : 0 }}>
                    {a.pass}
                  </span>
                </div>
              ) : (
                <div
                  key={id}
                  className={`v4-slot v4-slot-behind v4-slot-${i}`}
                  aria-hidden="true"
                  ref={(el) => el?.setAttribute('inert', '')}
                >
                  {i === 1 ? renderCard(id, false) : <div className="v4-card v4-card-ghost" />}
                </div>
              ),
            )}
        </div>
      )}

      {!finished && (
        <>
          <div className="v4-controls">
            <button type="button" className="v4-btn v4-btn-pass" onClick={() => request('pass')}>
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
              <span>{a.pass}</span>
            </button>
            <button type="button" className="v4-btn v4-btn-undo" onClick={requestUndo} aria-disabled={!canUndo || undefined} title={a.undo}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 14L4 9l5-5" />
                <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
              </svg>
              <span className="sr-only">{a.undo}</span>
            </button>
            <button
              type="button"
              className="v4-btn v4-btn-yes"
              onClick={() => request('interested')}
              aria-disabled={interestedDisabled || undefined}
              aria-describedby={interestedDisabled && interestedNote ? noteId : undefined}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              <span>{interestedLabel ?? a.interested}</span>
            </button>
          </div>
          {interestedDisabled && interestedNote && (
            <p className="v4-note v4-note-warn" id={noteId}>
              {interestedNote}
            </p>
          )}
          {undoLockedNote && <p className="v4-note">{undoLockedNote}</p>}
          {size === 'full' && (
            <div className="v4-hints">
              <p className="v4-hint-drag">{c.dragHint}</p>
              <p className="v4-keys">
                <span className="v4-keys-label">{t.variants.keyboardHint}</span>
                {c.keys.map((k) => (
                  <span key={k.key} className="v4-key">
                    <kbd>{k.key}</kbd> {k.label}
                  </span>
                ))}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
