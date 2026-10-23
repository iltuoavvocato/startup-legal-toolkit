import type { ComponentType } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { I18nContext, makeI18n } from './i18n/context';
import { localeFromPath, routePatterns, type RouteId } from './i18n/routes';
import { EquityPage } from './pages/EquityPage';
import { HomePage } from './pages/HomePage';
import { MatchInvestorPage } from './pages/MatchInvestorPage';
import { MatchLandingPage } from './pages/MatchLandingPage';
import { MatchLegalPage } from './pages/MatchLegalPage';
import { MatchOptInPage } from './pages/MatchOptInPage';
import { MatchStartupPage } from './pages/MatchStartupPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { QuizPage } from './pages/QuizPage';
import { VestingPage } from './pages/VestingPage';

const PAGES: Record<RouteId, ComponentType> = {
  home: HomePage,
  equity: EquityPage,
  vesting: VestingPage,
  quiz: QuizPage,
  privacy: PrivacyPage,
  match: MatchLandingPage,
  matchStartup: MatchStartupPage,
  matchInvestor: MatchInvestorPage,
  matchOptIn: MatchOptInPage,
  matchLegal: MatchLegalPage,
};

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
