import { FORMATTERS } from '../i18n/format';
import type { Locale } from '../i18n/locales';
import { MESSAGES } from '../i18n/messages';
import type { ReasonCtx } from '../i18n/messages/match';
import { AREA_DI, labelsFor, type Investor, type StartupProfile } from './matchTaxonomy';

/** Maximum points per part; they sum to 100. */
export const WEIGHTS = { settore: 30, ticket: 30, fase: 20, area: 20 } as const;
/** Share of the round an investor must be able to cover to earn full ticket points ("potrebbe guidare il round"). */
export const LEAD_COVERAGE = 0.4;

export const SETTORE_POINTS = { principale: 30, secondario: 20, generalista: 15 } as const;
export const FASE_POINTS = { principale: 20, secondaria: 12 } as const;
export const AREA_POINTS = { stessaRegione: 20, area: 14, italia: 8 } as const;

export type ScoreBand = 'molto-affine' | 'affine' | 'da-valutare';
export const SCORE_BANDS: { band: ScoreBand; min: number; label: string }[] = [
  { band: 'molto-affine', min: 80, label: MESSAGES.it.match.bands['molto-affine'] },
  { band: 'affine', min: 60, label: MESSAGES.it.match.bands.affine },
  { band: 'da-valutare', min: 0, label: MESSAGES.it.match.bands['da-valutare'] },
];

export function scoreBand(score: number, locale: Locale = 'it'): (typeof SCORE_BANDS)[number] {
  const band = SCORE_BANDS.find((b) => score >= b.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1]!;
  return { ...band, label: MESSAGES[locale].match.bands[band.band] };
}

export type Perspective = 'startup' | 'investitore';
export type FilterId = 'fase' | 'settore' | 'area' | 'ticket';

export interface Parts {
  settore: number;
  ticket: number;
  fase: number;
  area: number;
}

export interface Evaluation {
  eligible: boolean;
  score: number;
  parts: Parts;
  reasons: string[];
  failed: FilterId[];
  whyNot: string[];
}

/** Share of the round the investor can cover with its maximum ticket (0–1). */
export function coverage(s: Pick<StartupProfile, 'round'>, i: Pick<Investor, 'ticketMax'>): number {
  if (s.round <= 0) return 0;
  return Math.min(i.ticketMax, s.round) / s.round;
}

/** Evaluates one startup–investor pair. Pure and deterministic; `locale` only changes the wording. */
export function evaluate(
  s: StartupProfile,
  i: Investor,
  perspective: Perspective = 'startup',
  locale: Locale = 'it',
): Evaluation {
  const L = labelsFor(locale);
  const f = FORMATTERS[locale];
  const R = MESSAGES[locale].match.reasons[perspective];
  const area = AREA_DI[s.regione];
  const cov = coverage(s, i);
  const ctx: ReasonCtx = {
    settore: L.settore[s.settore],
    fase: L.fase[s.fase],
    fasi: i.fasi.map((x) => L.fase[x]).join(', '),
    regione: L.regione[s.regione],
    area: L.area[area],
    min: f.euro(i.ticketMin),
    max: f.euro(i.ticketMax),
    round: f.euro(s.round),
    pct: f.percent(cov * 100, 0),
  };

  const failed: FilterId[] = [];
  const whyNot: string[] = [];

  // Hard filters, in a fixed order.
  if (!i.fasi.includes(s.fase)) {
    failed.push('fase');
    whyNot.push(R.notFase(ctx));
  }
  if (i.settori !== 'tutti' && !i.settori.includes(s.settore)) {
    failed.push('settore');
    whyNot.push(R.notSettore(ctx));
  }
  if (i.aree !== 'italia' && !i.aree.includes(area)) {
    failed.push('area');
    whyNot.push(R.notArea(ctx));
  }
  if (i.ticketMin > s.round) {
    failed.push('ticket');
    whyNot.push(R.notTicket(ctx));
  }

  // Parts of the score.
  const settorePts =
    i.settori === 'tutti'
      ? SETTORE_POINTS.generalista
      : i.settori[0] === s.settore
        ? SETTORE_POINTS.principale
        : i.settori.includes(s.settore)
          ? SETTORE_POINTS.secondario
          : 0;
  const ticketPts = WEIGHTS.ticket * Math.min(1, cov / LEAD_COVERAGE);
  const fasePts = i.fasi[0] === s.fase ? FASE_POINTS.principale : i.fasi.includes(s.fase) ? FASE_POINTS.secondaria : 0;
  const areaPts =
    i.sede === s.regione
      ? AREA_POINTS.stessaRegione
      : i.aree !== 'italia' && i.aree.includes(area)
        ? AREA_POINTS.area
        : i.aree === 'italia'
          ? AREA_POINTS.italia
          : 0;

  const parts: Parts = { settore: settorePts, ticket: ticketPts, fase: fasePts, area: areaPts };
  const eligible = failed.length === 0;
  const score = eligible ? Math.round(settorePts + ticketPts + fasePts + areaPts) : 0;

  const reasons: string[] = [];
  if (eligible) {
    reasons.push(
      i.settori === 'tutti'
        ? R.generalist(ctx)
        : settorePts === SETTORE_POINTS.principale
          ? R.settoreMain(ctx)
          : R.settoreOther(ctx),
    );
    reasons.push(cov >= 1 ? R.ticketFull(ctx) : cov >= LEAD_COVERAGE ? R.ticketLead(ctx) : R.ticketPart(ctx));
    reasons.push(fasePts === FASE_POINTS.principale ? R.faseMain(ctx) : R.faseOther(ctx));
    reasons.push(
      areaPts === AREA_POINTS.stessaRegione ? R.sameRegion(ctx) : areaPts === AREA_POINTS.area ? R.area(ctx) : R.italia(ctx),
    );
  }

  return { eligible, score, parts, reasons, failed, whyNot };
}

export interface Ranked<T> {
  item: T;
  evaluation: Evaluation;
}

export interface MatchResult<T> {
  matches: Ranked<T>[];
  excluded: Ranked<T>[];
}

function byName(a: { nome: string; id: string }, b: { nome: string; id: string }): number {
  return a.nome.localeCompare(b.nome, 'it') || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

function rank<T extends { nome: string; id: string }>(rows: Ranked<T>[]): MatchResult<T> {
  const matches = rows
    .filter((r) => r.evaluation.eligible)
    .sort(
      (a, b) =>
        b.evaluation.score - a.evaluation.score ||
        b.evaluation.parts.ticket - a.evaluation.parts.ticket ||
        b.evaluation.parts.settore - a.evaluation.parts.settore ||
        byName(a.item, b.item),
    );
  const excluded = rows
    .filter((r) => !r.evaluation.eligible)
    .sort((a, b) => a.evaluation.failed.length - b.evaluation.failed.length || byName(a.item, b.item));
  return { matches, excluded };
}

/** Startup side: which investors fit this startup. */
export function matchInvestors(s: StartupProfile, investors: readonly Investor[], locale: Locale = 'it'): MatchResult<Investor> {
  return rank(investors.map((i) => ({ item: i, evaluation: evaluate(s, i, 'startup', locale) })));
}

/** Investor side: which startups fit this thesis. */
export function matchStartups(i: Investor, startups: readonly StartupProfile[], locale: Locale = 'it'): MatchResult<StartupProfile> {
  return rank(startups.map((s) => ({ item: s, evaluation: evaluate(s, i, 'investitore', locale) })));
}
