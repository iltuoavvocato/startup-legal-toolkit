import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import { DISCLAIMER, lawyerUrl } from '../site';
import { ExternalLink } from './ExternalLink';
import { Logo } from './Logo';

const NAV = [
  { to: '/equity/', label: 'Ripartizione quote' },
  { to: '/vesting/', label: 'Vesting' },
  { to: '/quiz/', label: 'Quali documenti?' },
  { to: '/match-investitori/', label: 'Investitori' },
];

function routeKey(pathname: string): string {
  const p = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return p;
}

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const firstRender = useRef(true);
  usePageMeta(routeKey(pathname));

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

  const campaign = pathname.includes('match-investitori')
    ? 'match'
    : pathname.includes('equity')
    ? 'equity'
    : pathname.includes('vesting')
      ? 'vesting'
      : pathname.includes('quiz')
        ? 'quiz'
        : 'home';

  return (
    <>
      <a className="skip-link" href="#main">
        Vai al contenuto
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand" aria-label="Startup Legal Toolkit — home">
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
            <span className="sr-only">{menuOpen ? 'Chiudi il menu' : 'Apri il menu'}</span>
          </button>
          <nav id="site-nav" className={`site-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Principale">
            <ul>
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} className={({ isActive }) => (isActive ? 'active' : undefined)}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <ExternalLink href={lawyerUrl(campaign)} className="btn btn-gold btn-sm">
              Parla con un avvocato
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
            <p>Strumenti gratuiti per founder, a cura di ilTuoAvvocato.com</p>
          </div>
          <nav aria-label="Footer" className="footer-nav">
            <ul>
              {NAV.map((item) => (
                <li key={item.to}>
                  <Link to={item.to}>{item.label}</Link>
                </li>
              ))}
              <li>
                <Link to="/privacy/">Privacy</Link>
              </li>
              <li>
                <ExternalLink href={lawyerUrl(campaign)}>iltuoavvocato.com</ExternalLink>
              </li>
            </ul>
          </nav>
        </div>
        <div className="container footer-bottom">
          <p className="footer-disclaimer">{DISCLAIMER}</p>
          <p>© {new Date().getFullYear()} ilTuoAvvocato.com</p>
        </div>
      </footer>
    </>
  );
}
