// Variant V1: placeholder screens (replaced by the real implementation).
import { useI18n } from '../../i18n/context';

function Placeholder() {
  const { t } = useI18n();
  return (
    <section style={{ padding: '3rem 1.25rem' }}>
      <h1 id="page-title" tabIndex={-1}>
        V1 · {t.variants.variants.v1.name}
      </h1>
      <p>{t.variants.v1.placeholder}</p>
    </section>
  );
}

export const Landing = Placeholder;
export const Results = Placeholder;
export const Investor = Placeholder;
export function Thumb() {
  return <div aria-hidden="true" />;
}
