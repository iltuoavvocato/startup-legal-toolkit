import { useEffect, useRef, useState } from 'react';
import { AGENT_STEPS } from '../../lib/deck';

const STEP_MS = 450;

interface Props {
  hasDeck: boolean;
  onDone: () => void;
}

/** Deterministic fake processing: the steps tick in order, then onDone fires. */
export function AgentProcessing({ hasDeck, onDone }: Props) {
  const [done, setDone] = useState(0);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (done >= AGENT_STEPS.length) {
      const t = window.setTimeout(() => onDoneRef.current(), 300);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setDone((d) => d + 1), STEP_MS);
    return () => window.clearTimeout(t);
  }, [done]);

  const current = AGENT_STEPS[Math.min(done, AGENT_STEPS.length - 1)];
  return (
    <div className="mi-agent">
      <ol className="mi-agent-steps">
        {AGENT_STEPS.map((s, i) => (
          <li key={s} className={i < done ? 'is-done' : i === done ? 'is-active' : undefined}>
            <span className="mi-agent-dot" aria-hidden="true">
              {i < done ? '✓' : ''}
            </span>
            {i === 0 && !hasDeck ? 'Lettura dei dati inseriti' : s}
            <span className="sr-only">{i < done ? ' (fatto)' : i === done ? ' (in corso)' : ''}</span>
          </li>
        ))}
      </ol>
      <p className="sr-only" role="status" aria-live="polite">
        {done >= AGENT_STEPS.length ? 'Bozza del profilo pronta.' : `${current}…`}
      </p>
      <p className="field-hint">
        Simulazione: in questo prototipo l’agente non legge davvero il file. I campi sono ricavati dal modulo e dal nome
        del file.
      </p>
      <button type="button" className="btn btn-text btn-sm" onClick={() => onDoneRef.current()}>
        Salta l’attesa
      </button>
    </div>
  );
}
