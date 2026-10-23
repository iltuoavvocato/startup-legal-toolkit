import { useI18n } from '../../i18n/context';

export function DemoBadge() {
  const { t } = useI18n();
  return <span className="pill mi-demo">{t.match.demoLabel}</span>;
}
