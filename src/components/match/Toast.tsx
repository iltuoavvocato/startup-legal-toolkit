import { useEffect, useRef } from 'react';
import { useI18n } from '../../i18n/context';

/**
 * Status toast. The live region is always in the DOM (so screen readers pick up the change); the visible bubble only
 * shows while there is a message. Auto-dismisses after a few seconds; Escape or the close button dismiss it earlier.
 * Escape is left to any other open layer (modal dialog, filter sheet, mobile menu) unless focus is in the toast.
 */
export function Toast({ message, onDone, timeout = 5000 }: { message: string; onDone: () => void; timeout?: number }) {
  const { t } = useI18n();
  const bubble = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDone, timeout);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || !bubble.current) return;
      const inToast = bubble.current.contains(document.activeElement);
      if (!inToast && document.querySelector('dialog[open], [aria-modal="true"], .site-nav.is-open')) return;
      onDone();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
    };
  }, [message, onDone, timeout]);
  return (
    <div className="mi-toast-region" role="status" aria-live="polite">
      {message && (
        <div className="mi-toast" ref={bubble}>
          <span className="mi-toast-icon" aria-hidden="true">
            ✓
          </span>
          <span>{message}</span>
          <button type="button" className="mi-toast-close" onClick={onDone} aria-label={t.polish.toast.close}>
            <span aria-hidden="true">×</span>
          </button>
        </div>
      )}
    </div>
  );
}
