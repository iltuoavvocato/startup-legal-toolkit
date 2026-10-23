import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../i18n/context';
import { LOCALES } from '../i18n/locales';
import { routeFromPath, switchLocalePath } from '../i18n/routes';
import { storeLocale } from '../i18n/storage';

/** IT / EN links to the equivalent page in each language. Using it stores the choice (localStorage "lang"). */
export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const { pathname, search } = useLocation();
  const known = routeFromPath(pathname) !== null;
  return (
    <div className="lang-switch" role="group" aria-label={t.common.lang.label}>
      {LOCALES.map((l) => (
        <Link
          key={l}
          to={`${switchLocalePath(pathname, l)}${known ? search : ''}`}
          lang={l}
          hrefLang={l}
          aria-current={l === locale ? 'true' : undefined}
          className={l === locale ? 'is-current' : undefined}
          onClick={() => storeLocale(l)}
        >
          <span aria-hidden="true">{l.toUpperCase()}</span>
          <span className="sr-only">{t.common.lang[l]}</span>
        </Link>
      ))}
    </div>
  );
}
