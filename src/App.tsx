import { Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { I18nContext, makeI18n } from './i18n/context';
import { localeFromPath, routePatterns } from './i18n/routes';
import { NotFoundPage } from './pages/NotFoundPage';
import { PAGES } from './routePages';

export function App() {
  const { pathname } = useLocation();
  const locale = localeFromPath(pathname);
  return (
    <I18nContext.Provider value={makeI18n(locale)}>
      <Layout>
        <Routes>
          {routePatterns().map(({ id, locale: l, pattern }) => {
            const Page = PAGES[id];
            // The key remounts the page when switching language, so in-memory state never mixes locales.
            return <Route key={`${l}-${id}`} path={pattern} element={<Page key={l} />} />;
          })}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </I18nContext.Provider>
  );
}
