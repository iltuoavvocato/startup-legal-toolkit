// Variant V5: placeholder screens (replaced by the real implementation).
import { useI18n } from '../../i18n/context';

function Placeholder() {
  const { t } = useI18n();
  return (
    <section style={{ padding: '3rem 1.25rem' }}>
      <h1 id="page-title" tabIndex={-1}>
        V5 · {t.variants.variants.v5.name}
      </h1>
      <p>{t.variants.v5.placeholder}</p>
    </section>
  );
}

export const Landing = Placeholder;
export const Results = Placeholder;
export const Investor = Placeholder;
export function Thumb() {
  return <div aria-hidden="true" />;
}
