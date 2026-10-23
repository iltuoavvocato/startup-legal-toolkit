interface Props {
  id: string;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  hint?: string;
  error?: string;
}

export function EuroField({ id, label, value, onChange, hint, error }: Props) {
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field mi-field">
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
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          onChange={(e) => {
            const n = Math.round(Number(e.target.value));
            onChange(e.target.value === '' || !Number.isFinite(n) ? null : Math.max(0, n));
          }}
        />
      </div>
      {hint && (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="mi-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
