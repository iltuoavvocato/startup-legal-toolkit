interface Props {
  id: string;
  legend: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

/** Single choice using the toolkit's segmented control. */
export function SegmentedField({ id, legend, options, value, onChange }: Props) {
  return (
    <fieldset className="segmented-field">
      <legend>{legend}</legend>
      <div className="segmented">
        {options.map((o) => (
          <label key={o.value} className={value === o.value ? 'is-checked' : undefined}>
            <input type="radio" name={id} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
