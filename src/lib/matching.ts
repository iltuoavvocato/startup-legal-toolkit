import { formatEuro, formatPercent } from './format';
import {
  AREA_DI,
  AREA_LABEL,
  FASE_LABEL,
  REGIONE_LABEL,
  SETTORE_LABEL,
  type Investor,
  type StartupProfile,
} from './matchTaxonomy';

/** Maximum points per part; they sum to 100. */
export const WEIGHTS = { settore: 30, ticket: 30, fase: 20, area: 20 } as const;
/** Share of the round an investor must be able to cover to earn full ticket points ("potrebbe guidare il round"). */
export const LEAD_COVERAGE = 0.4;

export const SETTORE_POINTS = { principale: 30, secondario: 20, generalista: 15 } as const;
export const FASE_POINTS = { principale: 20, secondaria: 12 } as const;
export const AREA_POINTS = { stessaRegione: 20, area: 14, italia: 8 } as const;

export type ScoreBand = 'molto-affine' | 'affine' | 'da-valutare';
export const SCORE_BANDS: { band: ScoreBand; min: number; label: string }[] = [
  { band: 'molto-affine', min: 80, label: 'Molto affine' },
  { band: 'affine', min: 60, label: 'Affine' },
  { band: 'da-valutare', min: 0, label: 'Da valutare' },
];

export function scoreBand(score: number): (typeof SCORE_BANDS)[number] {
  return SCORE_BANDS.find((b) => score >= b.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1]!;
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

const list = (items: string[]) => items.join(', ');

/** Share of the round the investor can cover with its maximum ticket (0–1). */
export function coverage(s: Pick<StartupProfile, 'round'>, i: Pick<Investor, 'ticketMax'>): number {
  if (s.round <= 0) return 0;
  return Math.min(i.ticketMax, s.round) / s.round;
}

/** Evaluates one startup–investor pair. Pure and deterministic. */
export function evaluate(s: StartupProfile, i: Investor, perspective: Perspective = 'startup'): Evaluation {
  const forStartup = perspective === 'startup';
  const settore = SETTORE_LABEL[s.settore];
  const fase = FASE_LABEL[s.fase];
  const area = AREA_DI[s.regione];

  const failed: FilterId[] = [];
  const whyNot: string[] = [];

  // Hard filters, in a fixed order.
  if (!i.fasi.includes(s.fase)) {
    failed.push('fase');
    whyNot.push(
      forStartup
        ? `Non investe in fase ${fase} (investe in: ${list(i.fasi.map((f) => FASE_LABEL[f]))})`
        : `È in fase ${fase}, fuori dalle fasi che hai scelto`,
    );
  }
  if (i.settori !== 'tutti' && !i.settori.includes(s.settore)) {
    failed.push('settore');
    whyNot.push(forStartup ? `Non investe nel settore ${settore}` : `Il settore ${settore} non è tra quelli che hai scelto`);
  }
  if (i.aree !== 'italia' && !i.aree.includes(area)) {
    failed.push('area');
    whyNot.push(
      forStartup
        ? `Non investe in ${AREA_LABEL[area]}`
        : `Ha sede in ${REGIONE_LABEL[s.regione]} (${AREA_LABEL[area]}), fuori dalle aree che hai scelto`,
    );
  }
  if (i.ticketMin > s.round) {
    failed.push('ticket');
    whyNot.push(
      forStartup
        ? `Ticket minimo di ${formatEuro(i.ticketMin)}, superiore al round di ${formatEuro(s.round)}`
        : `Cerca ${formatEuro(s.round)}, meno del tuo ticket minimo di ${formatEuro(i.ticketMin)}`,
    );
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
  const cov = coverage(s, i);
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
    // Settore
    if (i.settori === 'tutti') {
      reasons.push(forStartup ? 'Investitore generalista: valuta tutti i settori' : `Settore ${settore}: valuti tutti i settori`);
    } else if (settorePts === SETTORE_POINTS.principale) {
      reasons.push(forStartup ? `Il settore ${settore} è il suo focus principale` : `Settore ${settore}: il tuo focus principale`);
    } else {
      reasons.push(forStartup ? `Investe anche nel settore ${settore}` : `Settore ${settore}: tra quelli che segui`);
    }
    // Ticket
    const range = `${formatEuro(i.ticketMin)} a ${formatEuro(i.ticketMax)}`;
    if (cov >= 1) {
      reasons.push(
        forStartup
          ? `Ticket da ${range}: potrebbe coprire l’intero round`
          : `Round di ${formatEuro(s.round)}: potresti coprirlo per intero`,
      );
    } else if (cov >= LEAD_COVERAGE) {
      reasons.push(
        forStartup
          ? `Ticket da ${range}: potrebbe guidare il round`
          : `Round di ${formatEuro(s.round)}: potresti guidarlo (fino al ${formatPercent(cov * 100, 0)})`,
      );
    } else {
      reasons.push(
        forStartup
          ? `Ticket da ${range}: può coprire fino al ${formatPercent(cov * 100, 0)} del round`
          : `Round di ${formatEuro(s.round)}: il tuo ticket ne copre fino al ${formatPercent(cov * 100, 0)}`,
      );
    }
    // Fase
    reasons.push(
      fasePts === FASE_POINTS.principale
        ? forStartup
          ? `Investe soprattutto in fase ${fase}`
          : `Fase ${fase}: la tua fase principale`
        : forStartup
          ? `Investe anche in fase ${fase}`
          : `Fase ${fase}: tra quelle che segui`,
    );
    // Area
    if (areaPts === AREA_POINTS.stessaRegione) {
      reasons.push(`Ha sede in ${REGIONE_LABEL[s.regione]}, come te`);
    } else if (areaPts === AREA_POINTS.area) {
      reasons.push(
        forStartup ? `Investe in ${AREA_LABEL[area]}` : `Ha sede in ${REGIONE_LABEL[s.regione]} (${AREA_LABEL[area]})`,
      );
    } else {
      reasons.push(forStartup ? 'Investe in tutta Italia' : `Ha sede in ${REGIONE_LABEL[s.regione]}: investi in tutta Italia`);
    }
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
export function matchInvestors(s: StartupProfile, investors: readonly Investor[]): MatchResult<Investor> {
  return rank(investors.map((i) => ({ item: i, evaluation: evaluate(s, i, 'startup') })));
}

/** Investor side: which startups fit this thesis. */
export function matchStartups(i: Investor, startups: readonly StartupProfile[]): MatchResult<StartupProfile> {
  return rank(startups.map((s) => ({ item: s, evaluation: evaluate(s, i, 'investitore') })));
}
