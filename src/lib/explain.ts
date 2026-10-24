// "Come funziona il matching" / "Why this match": the scoring rules and a per-part breakdown of one pair, both derived
// from the constants and the evaluation in matching.ts, so the explainer can't drift from the real algorithm.
import type { Locale } from '../i18n/locales';
import { MESSAGES } from '../i18n/messages';
import {
  AREA_POINTS,
  FASE_POINTS,
  LEAD_COVERAGE,
  SCORE_BANDS,
  SETTORE_POINTS,
  WEIGHTS,
  coverage,
  evaluate,
  scoreBand,
  type Evaluation,
  type FilterId,
} from './matching';
import type { Investor, StartupProfile } from './matchTaxonomy';

export type PartId = keyof typeof WEIGHTS;

/** Order the parts are shown in (same as the score table). */
export const PART_ORDER: readonly PartId[] = ['settore', 'ticket', 'fase', 'area'];

/** Which rule gave a part its points. 'nessuno' = no points (only possible when a hard filter fails). */
export type RuleId =
  | 'principale'
  | 'secondario'
  | 'generalista'
  | 'stessaRegione'
  | 'area'
  | 'italia'
  | 'pieno'
  | 'parziale'
  | 'nessuno';

export interface ScoringRule {
  part: PartId;
  max: number;
  /** Fixed tiers with their points; the ticket part is proportional, so its single tier is the full-points one. */
  tiers: { rule: RuleId; points: number }[];
}

/** The scoring table, straight from the constants. */
export const SCORING_RULES: readonly ScoringRule[] = [
  {
    part: 'settore',
    max: WEIGHTS.settore,
    tiers: [
      { rule: 'principale', points: SETTORE_POINTS.principale },
      { rule: 'secondario', points: SETTORE_POINTS.secondario },
      { rule: 'generalista', points: SETTORE_POINTS.generalista },
    ],
  },
  { part: 'ticket', max: WEIGHTS.ticket, tiers: [{ rule: 'pieno', points: WEIGHTS.ticket }] },
  {
    part: 'fase',
    max: WEIGHTS.fase,
    tiers: [
      { rule: 'principale', points: FASE_POINTS.principale },
      { rule: 'secondario', points: FASE_POINTS.secondaria },
    ],
  },
  {
    part: 'area',
    max: WEIGHTS.area,
    tiers: [
      { rule: 'stessaRegione', points: AREA_POINTS.stessaRegione },
      { rule: 'area', points: AREA_POINTS.area },
      { rule: 'italia', points: AREA_POINTS.italia },
    ],
  },
];

/** The hard filter that guards each part. */
export const FILTER_OF: Record<PartId, FilterId> = { settore: 'settore', ticket: 'ticket', fase: 'fase', area: 'area' };

export interface BreakdownRow {
  part: PartId;
  points: number;
  max: number;
  rule: RuleId;
  /** False when this part's hard filter excludes the pair. */
  passes: boolean;
}

export interface Breakdown {
  rows: BreakdownRow[];
  /** Share of the round the maximum ticket covers (0–1). */
  coverage: number;
  /** Sum of the parts before rounding. */
  raw: number;
  evaluation: Evaluation;
}

function ruleOf(part: PartId, points: number, s: StartupProfile, i: Investor, cov: number): RuleId {
  if (part === 'ticket') return cov >= LEAD_COVERAGE ? 'pieno' : cov > 0 ? 'parziale' : 'nessuno';
  if (points === 0) return 'nessuno';
  if (part === 'settore') {
    if (i.settori === 'tutti') return 'generalista';
    return points === SETTORE_POINTS.principale ? 'principale' : 'secondario';
  }
  if (part === 'fase') return points === FASE_POINTS.principale ? 'principale' : 'secondario';
  if (i.sede === s.regione) return 'stessaRegione';
  return i.aree === 'italia' ? 'italia' : 'area';
}

/** Per-part breakdown of one pair, read from the real evaluation (startup's point of view unless told otherwise). */
export function breakdown(
  s: StartupProfile,
  i: Investor,
  locale: Locale = 'it',
  evaluation: Evaluation = evaluate(s, i, 'startup', locale),
): Breakdown {
  const cov = coverage(s, i);
  const rows = PART_ORDER.map((part) => {
    const passes = !evaluation.failed.includes(FILTER_OF[part]);
    // A part whose filter fails earns nothing (only the ticket part could otherwise show points).
    const points = passes ? evaluation.parts[part] : 0;
    return { part, points, max: WEIGHTS[part], rule: ruleOf(part, points, s, i, cov), passes };
  });
  return { rows, coverage: cov, raw: rows.reduce((sum, r) => sum + r.points, 0), evaluation };
}

/** "Molto affine da 80, Affine da 60, Da valutare da 0", from SCORE_BANDS. */
export function bandList(locale: Locale = 'it'): string {
  const x = MESSAGES[locale].match.ui.explainer;
  return SCORE_BANDS.map((b) => x.band(scoreBand(b.min, locale).label, b.min)).join(', ');
}

/** Rounds the explainer can try in the interactive example (€). */
export const EXAMPLE_ROUNDS = [150_000, 500_000, 1_000_000, 3_000_000, 6_000_000] as const;

/** Fictional pair for the "why this match" example: every part scores something, none scores full marks by default. */
export const EXAMPLE_STARTUP_CORE: Pick<StartupProfile, 'settore' | 'fase' | 'regione' | 'round'> = {
  settore: 'saas-b2b',
  fase: 'serie-a',
  regione: 'piemonte',
  round: 3_000_000,
};

/** Demo investor used in the example (fictional, from the sample data). */
export const EXAMPLE_INVESTOR_ID = 'i01';
