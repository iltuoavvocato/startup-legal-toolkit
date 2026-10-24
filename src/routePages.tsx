// Every page is its own chunk, so a visit downloads only the page it opens (plus the shared app shell).
// main.tsx loads the current page's chunk before the first render (no loading flash, no layout shift), the
// prerendered HTML already has a <link rel="modulepreload"> for it (scripts/prerender.mjs reads the import paths
// below), and links prefetch their page on hover, touch or focus.
import { lazy, Suspense, useState, type ComponentType } from 'react';
import { PageLoading } from './components/PageLoading';
import { routeFromPath, type RouteId } from './i18n/routes';
import { VARIANT_ROUTE_IDS, parseVariantRouteId } from './variants/registry';

type Loader = () => Promise<ComponentType>;

function lazyPage(load: Loader): { Page: ComponentType; preload: () => Promise<unknown> } {
  let loaded: ComponentType | null = null;
  let pending: Promise<ComponentType> | null = null;
  const get = () =>
    (pending ??= load().then(
      (c) => (loaded = c),
      (err: unknown) => {
        pending = null; // a failed download (offline) can be retried by the next navigation
        throw err;
      },
    ));
  const Lazy = lazy(() => get().then((c) => ({ default: c })));
  function Page() {
    // Decided once per mount: switching from the Suspense path to the direct one would remount the page.
    const [Ready] = useState(() => loaded);
    if (Ready) return <Ready />;
    return (
      <Suspense fallback={<PageLoading />}>
        <Lazy />
      </Suspense>
    );
  }
  return { Page, preload: get };
}

const variantScreen = (id: string): Loader => {
  const { variant, screen } = parseVariantRouteId(id)!;
  return () =>
    import('./variants/VariantScreen').then(({ default: VariantScreen }) => {
      const Screen = () => <VariantScreen variant={variant} screen={screen} />;
      return Screen;
    });
};

const LOADERS: Record<RouteId, Loader> = {
  home: () => import('./pages/HomePage').then((m) => m.HomePage),
  equity: () => import('./pages/EquityPage').then((m) => m.EquityPage),
  vesting: () => import('./pages/VestingPage').then((m) => m.VestingPage),
  quiz: () => import('./pages/QuizPage').then((m) => m.QuizPage),
  privacy: () => import('./pages/PrivacyPage').then((m) => m.PrivacyPage),
  match: () => import('./pages/MatchLandingPage').then((m) => m.MatchLandingPage),
  matchStartup: () => import('./pages/MatchStartupPage').then((m) => m.MatchStartupPage),
  matchInvestor: () => import('./pages/MatchInvestorPage').then((m) => m.MatchInvestorPage),
  matchAgentStartup: () => import('./pages/MatchAgentPage').then((m) => m.MatchAgentStartupPage),
  matchAgentInvestor: () => import('./pages/MatchAgentPage').then((m) => m.MatchAgentInvestorPage),
  matchOptIn: () => import('./pages/MatchOptInPage').then((m) => m.MatchOptInPage),
  matchLegal: () => import('./pages/MatchLegalPage').then((m) => m.MatchLegalPage),
  matchHowItWorks: () => import('./pages/MatchHowItWorksPage').then((m) => m.MatchHowItWorksPage),
  matchDirectory: () => import('./pages/MatchDirectoryPage').then((m) => m.MatchDirectoryPage),
  matchInvestorProfile: () => import('./pages/MatchInvestorProfilePage').then((m) => m.MatchInvestorProfilePage),
  matchRequests: () => import('./pages/MatchRequestsPage').then((m) => m.MatchRequestsPage),
  matchExport: () => import('./pages/MatchExportPage').then((m) => m.MatchExportPage),
  matchGuidedDemo: () => import('./pages/MatchGuidedDemoPage').then((m) => m.MatchGuidedDemoPage),
  matchVariants: () => import('./variants/GalleryPage').then((m) => m.default),
  ...Object.fromEntries(VARIANT_ROUTE_IDS.map((id) => [id, variantScreen(id)])),
} as Record<RouteId, Loader>;

const ROUTE_PAGES = Object.fromEntries(Object.entries(LOADERS).map(([id, load]) => [id, lazyPage(load)])) as Record<
  RouteId,
  ReturnType<typeof lazyPage>
>;

export const PAGES = Object.fromEntries(Object.entries(ROUTE_PAGES).map(([id, r]) => [id, r.Page])) as Record<RouteId, ComponentType>;

/** Loads the chunk of the page at `pathname` (router path, without the base). Unknown paths resolve at once. */
export function preloadPath(pathname: string): Promise<unknown> {
  const route = routeFromPath(pathname);
  return route ? ROUTE_PAGES[route.id].preload().catch(() => undefined) : Promise.resolve();
}

/** Router path of a same-origin URL inside the app (base stripped), or null. */
function routerPath(url: URL, base: string): string | null {
  if (url.origin !== window.location.origin || !url.pathname.startsWith(base)) return null;
  return `/${url.pathname.slice(base.length)}`;
}

/** Prefetches a link's page on hover, touch or keyboard focus, so client-side navigation renders at once. */
export function prefetchOnIntent(base: string): void {
  const onIntent = (e: Event) => {
    const a = (e.target as Element | null)?.closest?.('a[href]');
    if (!(a instanceof HTMLAnchorElement)) return;
    const path = routerPath(new URL(a.href), base);
    if (path) void preloadPath(path);
  };
  for (const type of ['pointerover', 'touchstart', 'focusin']) document.addEventListener(type, onIntent, { passive: true });
}

/** Router path of the current page (base stripped). */
export function currentRouterPath(base: string): string {
  return routerPath(new URL(window.location.href), base) ?? '/';
}
