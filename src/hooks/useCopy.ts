import { useCallback, useEffect, useRef, useState } from 'react';

export type CopyState = 'idle' | 'copied' | 'error';

function fallbackCopy(text: string): boolean {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

export function useCopy(): [CopyState, (text: string) => void] {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback((text: string) => {
    const done = (ok: boolean) => {
      setState(ok ? 'copied' : 'error');
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setState('idle'), 2500);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => done(true),
        () => done(fallbackCopy(text)),
      );
    } else {
      done(fallbackCopy(text));
    }
  }, []);

  return [state, copy];
}
