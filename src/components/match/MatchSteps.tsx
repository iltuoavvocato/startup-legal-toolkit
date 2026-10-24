import { useI18n } from '../../i18n/context';

interface Props {
  steps: readonly string[];
  current: number;
  label: string;
}

export function MatchSteps({ steps, current, label }: Props) {
  const { t } = useI18n();
  return (
    <ol className="mi-steps" aria-label={label}>
      {steps.map((s, i) => (
        <li
          key={s}
          className={i < current ? 'is-done' : i === current ? 'is-current' : undefined}
          aria-current={i === current ? 'step' : undefined}
        >
          <span className="mi-steps-num" aria-hidden="true">
            {i < current ? '✓' : i + 1}
          </span>
          <span className="mi-steps-label">
            {s}
            {i < current && <span className="sr-only">{t.match.ui.stepDone}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}
