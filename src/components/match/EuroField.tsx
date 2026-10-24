import { useI18n } from '../../i18n/context';

interface Props {
  id: string;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  hint?: string;
  error?: string;
}

/**
 * Native number input (keeps spinbutton semantics, validation and the numeric keypad), plus a read-out of the
 * amount with the locale's thousands separators (500.000 € / €500,000) linked via aria-describedby.
 */
export function EuroField({ id, label, value, onChange, hint, error }: Props) {
  const { t, f } = useI18n();
  const showAmount = value !== null && value > 0;
  const describedBy =
    [showAmount ? `${id}-amount` : '', hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') ||
    undefined;
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
      {showAmount && (
        <p className="field-hint mi-amount" id={`${id}-amount`}>
          {t.match.ui.amount(f.euro(value))}
        </p>
      )}
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
