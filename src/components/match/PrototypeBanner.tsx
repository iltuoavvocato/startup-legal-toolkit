import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { PRODUCT_NAME } from '../../lib/optin';
import { RequestsBadge } from './RequestsBadge';

export function PrototypeBanner() {
  const { t, path } = useI18n();
  const b = t.match.ui.banner;
  return (
    <div className="mi-banner" role="note" aria-label={b.aria}>
      <div className="container mi-banner-inner">
        <span className="mi-banner-tag">{b.tag}</span>
        <p>
          {PRODUCT_NAME} <span className="mi-muted">{t.match.provisional}</span>
          {b.text} <Link to={path('matchLegal')}>{b.link}</Link>
        </p>
        <Link to={path('matchRequests')} className="mi-banner-requests">
          {t.directory.nav.requests}
          <RequestsBadge />
        </Link>
      </div>
    </div>
  );
}
