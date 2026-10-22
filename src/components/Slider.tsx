import { useId, type CSSProperties, type ReactNode } from 'react';

interface Props {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** Visible formatted value; also used as aria-valuetext. */
  display: string;
  hint?: string;
  className?: string;
}

export function Slider({ label, value, min, max, step = 1, onChange, display, hint, className = '' }: Props) {
  const id = useId();
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return (
    <div className={`slider ${className}`.trim()}>
      <div className="slider-head">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} className="slider-value">
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={display}
        aria-describedby={hint ? `${id}-hint` : undefined}
        style={{ '--fill': `${pct}%` } as CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
    </div>
  );
}
