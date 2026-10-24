interface Option {
  value: string;
  label: string;
}

interface Props {
  id: string;
  legend: string;
  hint?: string;
  options: readonly Option[];
  selected: readonly string[];
  onChange: (next: string[]) => void;
  error?: string;
}

/** Multi-select as native checkboxes styled as chips. */
export function ChoiceChips({ id, legend, hint, options, selected, onChange, error }: Props) {
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  const toggle = (value: string) =>
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : options.map((o) => o.value).filter((v) => v === value || selected.includes(v)),
    );
  return (
    <fieldset className="mi-fieldset" aria-describedby={describedBy} aria-invalid={error ? true : undefined}>
      <legend className="mi-legend">{legend}</legend>
      {hint && (
        <p className="field-hint mi-legend-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      <div className="mi-chips">
        {options.map((o) => {
          const checked = selected.includes(o.value);
          return (
            <label key={o.value} className={`mi-chip ${checked ? 'is-checked' : ''}`}>
              <input type="checkbox" name={id} value={o.value} checked={checked} onChange={() => toggle(o.value)} />
              <span className="mi-chip-box" aria-hidden="true" />
              {o.label}
            </label>
          );
        })}
      </div>
      {error && (
        <p className="mi-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </fieldset>
  );
}
