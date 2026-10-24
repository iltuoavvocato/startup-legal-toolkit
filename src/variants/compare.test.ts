import { describe, expect, it } from 'vitest';
import { pathFor } from '../i18n/routes';
import { compareFromQuery, compareToQuery, DEFAULT_COMPARE, embedSrc } from './compare';
import { isEmbedded, variantRouteId } from './registry';

describe('compare view', () => {
  it('round-trips the selection through the query string', () => {
    const c = { left: 'v2', right: 'v5', screen: 'investor', width: 'mobile' } as const;
    expect(compareFromQuery(new URLSearchParams(compareToQuery(c)))).toEqual(c);
  });

  it('falls back to the defaults for missing or invalid values', () => {
    expect(compareFromQuery(new URLSearchParams())).toEqual(DEFAULT_COMPARE);
    expect(compareFromQuery(new URLSearchParams('a=v9&b=x&s=checkout&w=tv'))).toEqual(DEFAULT_COMPARE);
    expect(compareFromQuery(new URLSearchParams('a=v3')).left).toBe('v3');
    expect(compareFromQuery(new URLSearchParams('s=agent')).screen).toBe('agent');
    expect(compareFromQuery(new URLSearchParams('s=directory')).screen).toBe('directory');
  });

  it('builds embed URLs under the base path, in both languages', () => {
    expect(embedSrc('/', pathFor(variantRouteId('v1', 'results'), 'it'))).toBe('/match-investitori/varianti/v1/risultati/?embed=1');
    expect(embedSrc('/toolkit/', pathFor(variantRouteId('v4', 'investor'), 'en'))).toBe(
      '/toolkit/en/investor-match/variants/v4/investor/?embed=1',
    );
    expect(embedSrc('/', pathFor(variantRouteId('v3', 'agent'), 'it'))).toBe('/match-investitori/varianti/v3/agente/?embed=1');
    expect(embedSrc('/', pathFor(variantRouteId('v5', 'directory'), 'en'))).toBe('/en/investor-match/variants/v5/directory/?embed=1');
    expect(embedSrc('/toolkit', '/x/')).toBe('/toolkit/x/?embed=1');
    expect(isEmbedded('?embed=1')).toBe(true);
    expect(isEmbedded('?embed=0')).toBe(false);
    expect(isEmbedded('')).toBe(false);
  });
});
