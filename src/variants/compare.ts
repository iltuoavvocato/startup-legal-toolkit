// Side-by-side compare view of the gallery: selection ↔ query string, and iframe URLs. Pure.
import { EMBED_PARAM, SCREENS, VARIANT_IDS, type Screen, type VariantId } from './registry';

export type CompareWidth = 'desktop' | 'mobile';
export const COMPARE_WIDTHS: CompareWidth[] = ['desktop', 'mobile'];

export interface CompareState {
  left: VariantId;
  right: VariantId;
  screen: Screen;
  width: CompareWidth;
}

export const DEFAULT_COMPARE: CompareState = { left: 'v1', right: 'v4', screen: 'results', width: 'desktop' };

const isVariant = (v: string | null): v is VariantId => VARIANT_IDS.includes(v as VariantId);
const isScreen = (v: string | null): v is Screen => SCREENS.includes(v as Screen);

/** Reads ?a=v1&b=v4&s=results&w=mobile; invalid or missing values fall back to the defaults. */
export function compareFromQuery(q: URLSearchParams): CompareState {
  const a = q.get('a');
  const b = q.get('b');
  const s = q.get('s');
  const w = q.get('w');
  return {
    left: isVariant(a) ? a : DEFAULT_COMPARE.left,
    right: isVariant(b) ? b : DEFAULT_COMPARE.right,
    screen: isScreen(s) ? s : DEFAULT_COMPARE.screen,
    width: w === 'mobile' ? 'mobile' : 'desktop',
  };
}

export function compareToQuery(c: CompareState): Record<string, string> {
  return { a: c.left, b: c.right, s: c.screen, w: c.width };
}

/** URL of a variant screen for an iframe: base path + router path + embed flag. */
export function embedSrc(base: string, routerPath: string): string {
  const b = base.endsWith('/') ? base : `${base}/`;
  return `${b}${routerPath.replace(/^\//, '')}?${EMBED_PARAM}=1`;
}
