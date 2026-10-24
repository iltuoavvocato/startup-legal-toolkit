import { useI18n } from '../../i18n/context';

/** Prominent "Dati di esempio fittizi" / "Fictional sample data" label for pages built on the demo dataset. */
export function FictionalNotice() {
  const { t } = useI18n();
  return (
    <p className="mi-fictional" role="note">
      <strong className="mi-fictional-tag">{t.directory.fictional}</strong>
      <span>{t.directory.fictionalNote}</span>
    </p>
  );
}
