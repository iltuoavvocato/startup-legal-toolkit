import { lazy, Suspense, type ComponentType } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { I18nContext, makeI18n, useI18n } from './i18n/context';
import { localeFromPath, routePatterns, type RouteId } from './i18n/routes';
import { EquityPage } from './pages/EquityPage';
import { HomePage } from './pages/HomePage';
import { MatchAgentInvestorPage, MatchAgentStartupPage } from './pages/MatchAgentPage';
import { MatchDirectoryPage } from './pages/MatchDirectoryPage';
import { MatchInvestorPage } from './pages/MatchInvestorPage';
import { MatchInvestorProfilePage } from './pages/MatchInvestorProfilePage';
import { MatchLandingPage } from './pages/MatchLandingPage';
import { MatchLegalPage } from './pages/MatchLegalPage';
import { MatchOptInPage } from './pages/MatchOptInPage';
import { MatchRequestsPage } from './pages/MatchRequestsPage';
import { MatchStartupPage } from './pages/MatchStartupPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { QuizPage } from './pages/QuizPage';
import { VestingPage } from './pages/VestingPage';
import { VARIANT_ROUTE_IDS, parseVariantRouteId, type VariantRouteId } from './variants/registry';

// Design variants (internal, noindex): loaded on demand so the rest of the site is unaffected.
const VariantScreen = lazy(() => import('./variants/VariantScreen'));
const GalleryPage = lazy(() => import('./variants/GalleryPage'));

function VariantLoading() {
  const { t } = useI18n();
  return <p className="container section">{t.variants.loading}</p>;
}

function lazyPage(render: () => JSX.Element): ComponentType {
  return function LazyPage() {
    return <Suspense fallback={<VariantLoading />}>{render()}</Suspense>;
  };
}

const VARIANT_PAGES = Object.fromEntries(
  VARIANT_ROUTE_IDS.map((id) => {
    const { variant, screen } = parseVariantRouteId(id)!;
    return [id, lazyPage(() => <VariantScreen variant={variant} screen={screen} />)];
  }),
) as Record<VariantRouteId, ComponentType>;

const PAGES: Record<RouteId, ComponentType> = {
  home: HomePage,
  equity: EquityPage,
  vesting: VestingPage,
  quiz: QuizPage,
  privacy: PrivacyPage,
  match: MatchLandingPage,
  matchStartup: MatchStartupPage,
  matchInvestor: MatchInvestorPage,
  matchAgentStartup: MatchAgentStartupPage,
  matchAgentInvestor: MatchAgentInvestorPage,
  matchOptIn: MatchOptInPage,
  matchLegal: MatchLegalPage,
  matchDirectory: MatchDirectoryPage,
  matchInvestorProfile: MatchInvestorProfilePage,
  matchRequests: MatchRequestsPage,
  matchVariants: lazyPage(() => <GalleryPage />),
  ...VARIANT_PAGES,
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
