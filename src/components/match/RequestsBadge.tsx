import { useI18n } from '../../i18n/context';
import { actionCount } from '../../lib/inbox';
import { useInbox } from './useInbox';

/** Number of requests waiting for the user's own answer (both roles); nothing when there are none. */
export function RequestsBadge() {
  const { t } = useI18n();
  const { store, now } = useInbox();
  const n = actionCount(store, now);
  if (!n) return null;
  return (
    <span className="mi-badge">
      <span aria-hidden="true">{n}</span>
      <span className="sr-only">, {t.directory.nav.badgeSr(n)}</span>
    </span>
  );
}
