import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/context';
import { agentSteps } from '../../lib/deck';

const STEP_MS = 450;

interface Props {
  hasDeck: boolean;
  onDone: () => void;
}

/** Deterministic fake processing: the steps tick in order, then onDone fires. */
export function AgentProcessing({ hasDeck, onDone }: Props) {
  const { locale, t } = useI18n();
  const a = t.match.ui.agent;
  const steps = agentSteps(locale);
  const [done, setDone] = useState(0);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (done >= steps.length) {
      const t = window.setTimeout(() => onDoneRef.current(), 300);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setDone((d) => d + 1), STEP_MS);
    return () => window.clearTimeout(t);
  }, [done, steps.length]);

  const current = steps[Math.min(done, steps.length - 1)];
  return (
    <div className="mi-agent">
      <ol className="mi-agent-steps">
        {steps.map((s, i) => (
          <li key={s} className={i < done ? 'is-done' : i === done ? 'is-active' : undefined}>
            <span className="mi-agent-dot" aria-hidden="true">
              {i < done ? '✓' : ''}
            </span>
            {i === 0 && !hasDeck ? a.readingData : s}
            <span className="sr-only">{i < done ? a.done : i === done ? a.active : ''}</span>
          </li>
        ))}
      </ol>
      <p className="sr-only" role="status" aria-live="polite">
        {done >= steps.length ? a.ready : `${current}…`}
      </p>
      <p className="field-hint">{a.note}</p>
      <button type="button" className="btn btn-text btn-sm" onClick={() => onDoneRef.current()}>
        {a.skip}
      </button>
    </div>
  );
}
