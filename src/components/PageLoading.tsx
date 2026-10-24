import { useI18n } from '../i18n/context';

/** Shown while a page's chunk downloads after a client-side navigation (rare: links prefetch on intent). */
export function PageLoading() {
  const { t } = useI18n();
  return <p className="container section">{t.variants.loading}</p>;
}
