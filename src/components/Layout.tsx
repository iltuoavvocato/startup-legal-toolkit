import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import { useI18n } from '../i18n/context';
import { routeFromPath, type RouteId } from '../i18n/routes';
import { lawyerUrl, type ToolCampaign } from '../site';
import { ExternalLink } from './ExternalLink';
import { Logo } from './Logo';

const NAV = ['equity', 'vesting', 'quiz', 'match'] as const;

function campaignFor(id: RouteId | undefined): ToolCampaign {
  if (id === 'equity' || id === 'vesting' || id === 'quiz') return id;
  if (id?.startsWith('match')) return 'match';
  return 'home';
}

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const firstRender = useRef(true);
  const { t, path } = useI18n();
  usePageMeta(pathname);
  const nav = NAV.map((id) => ({ to: path(id), label: t.common.nav[id] }));

  useEffect(() => {
    setMenuOpen(false);
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    // On client-side navigation, start from the top and move focus to the new page heading.
    window.scrollTo(0, 0);
    document.getElementById('page-title')?.focus({ preventScroll: true });
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const campaign = campaignFor(routeFromPath(pathname)?.id);

  return (
    <>
      <a className="skip-link" href="#main">
        {t.common.skipLink}
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Link to={path('home')} className="brand" aria-label={t.common.brandLabel}>
            <Logo variant="light" height={15} />
            <span className="brand-sub">Startup Legal Toolkit</span>
          </Link>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="site-nav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="menu-icon" aria-hidden="true" />
            <span className="sr-only">{menuOpen ? t.common.menuClose : t.common.menuOpen}</span>
          </button>
          <nav id="site-nav" className={`site-nav ${menuOpen ? 'is-open' : ''}`} aria-label={t.common.navLabel}>
            <ul>
              {nav.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} className={({ isActive }) => (isActive ? 'active' : undefined)}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <ExternalLink href={lawyerUrl(campaign)} className="btn btn-gold btn-sm">
              {t.common.talkToLawyer}
            </ExternalLink>
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <Logo variant="light" height={16} />
            <p>{t.common.footerTagline}</p>
          </div>
          <nav aria-label={t.common.footerNavLabel} className="footer-nav">
            <ul>
              {nav.map((item) => (
                <li key={item.to}>
                  <Link to={item.to}>{item.label}</Link>
                </li>
              ))}
              <li>
                <Link to={path('privacy')}>{t.common.privacy}</Link>
              </li>
              <li>
                <ExternalLink href={lawyerUrl(campaign)}>iltuoavvocato.com</ExternalLink>
              </li>
            </ul>
          </nav>
        </div>
        <div className="container footer-bottom">
          <p className="footer-disclaimer">{t.common.disclaimer}</p>
          <p>© {new Date().getFullYear()} ilTuoAvvocato.com</p>
        </div>
      </footer>
    </>
  );
}
