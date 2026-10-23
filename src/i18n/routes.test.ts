import { describe, expect, it } from 'vitest';
import { FORMATTERS } from './format';
import { localeFromPath, metaFor, pathFor, routeFromPath, ROUTES, routePatterns, switchLocalePath } from './routes';
import { initialRedirect } from './storage';

describe('route mapping', () => {
  it('keeps Italian at the original URLs and puts English under /en/', () => {
    expect(pathFor('home', 'it')).toBe('/');
    expect(pathFor('home', 'en')).toBe('/en/');
    expect(pathFor('equity', 'it')).toBe('/equity/');
    expect(pathFor('equity', 'en')).toBe('/en/equity/');
    expect(pathFor('match', 'it')).toBe('/match-investitori/');
    expect(pathFor('match', 'en')).toBe('/en/investor-match/');
    expect(pathFor('matchOptIn', 'en')).toBe('/en/investor-match/double-opt-in/');
    for (const r of ROUTES) {
      expect(r.en.path.startsWith('/en/')).toBe(true);
      expect(r.it.path.startsWith('/en')).toBe(false);
    }
  });

  it('maps every page both ways', () => {
    for (const r of ROUTES) {
      expect(switchLocalePath(r.it.path, 'en')).toBe(r.en.path);
      expect(switchLocalePath(r.en.path, 'it')).toBe(r.it.path);
      expect(routeFromPath(r.en.path)).toEqual({ id: r.id, locale: 'en' });
    }
  });

  it('accepts paths without the trailing slash', () => {
    expect(routeFromPath('/en/investor-match/startup')).toEqual({ id: 'matchStartup', locale: 'en' });
    expect(routeFromPath('/vesting')).toEqual({ id: 'vesting', locale: 'it' });
  });

  it('detects the locale and falls back to the home page for unknown paths', () => {
    expect(localeFromPath('/en')).toBe('en');
    expect(localeFromPath('/en/whatever')).toBe('en');
    expect(localeFromPath('/english')).toBe('it');
    expect(localeFromPath('/quiz/')).toBe('it');
    expect(switchLocalePath('/en/nope/', 'it')).toBe('/');
    expect(switchLocalePath('/nope/', 'en')).toBe('/en/');
  });

  it('gives localised meta and a localised 404', () => {
    expect(metaFor('/en/quiz/').meta.title).toContain('Which legal documents');
    expect(metaFor('/quiz/').meta.title).toContain('Quali documenti');
    expect(metaFor('/en/missing').path).toBeNull();
    expect(metaFor('/en/missing').meta.title).toBe('Page not found | Startup Legal Toolkit');
    expect(metaFor('/missing').meta.title).toBe('Pagina non trovata | Startup Legal Toolkit');
  });

  it('registers one router pattern per page and language', () => {
    const patterns = routePatterns().map((p) => p.pattern);
    expect(patterns).toHaveLength(ROUTES.length * 2);
    expect(new Set(patterns).size).toBe(patterns.length);
    expect(patterns).toContain('/en/investor-match/legal-notes');
  });
});

describe('stored language preference', () => {
  it('only redirects the Italian home when English was chosen', () => {
    expect(initialRedirect('/', 'en')).toBe('/en/');
    expect(initialRedirect('/', 'it')).toBeNull();
    expect(initialRedirect('/', null)).toBeNull();
    expect(initialRedirect('/equity/', 'en')).toBeNull();
    expect(initialRedirect('/en/', 'it')).toBeNull();
  });
});

describe('locale formatting', () => {
  it('uses it-IT and en-GB with euros', () => {
    expect(FORMATTERS.it.percent(62.5)).toBe('62,5%');
    expect(FORMATTERS.en.percent(62.5)).toBe('62.5%');
    expect(FORMATTERS.it.euro(500000)).toBe('500.000\u00a0€');
    expect(FORMATTERS.en.euro(500000)).toBe('€500,000');
    expect(FORMATTERS.en.monthYear(new Date(2027, 0, 1))).toBe('Jan 2027');
    expect(FORMATTERS.it.monthYear(new Date(2027, 0, 1))).toBe('gen 2027');
  });
});
