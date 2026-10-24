import { describe, expect, it } from 'vitest';
import { DEMO_INVESTORS, DEMO_STARTUPS } from '../data/matchDemo';
import { MESSAGES } from '../i18n/messages';
import { LOCALES } from '../i18n/locales';
import { bandList, breakdown, EXAMPLE_INVESTOR_ID, EXAMPLE_ROUNDS, EXAMPLE_STARTUP_CORE, PART_ORDER, SCORING_RULES } from './explain';
import { MONTHLY_PROPOSAL_LIMIT, REQUEST_EXPIRY_DAYS } from './matchConfig';
import { AREA_POINTS, FASE_POINTS, LEAD_COVERAGE, SCORE_BANDS, SETTORE_POINTS, WEIGHTS, evaluate, matchInvestors } from './matching';
import type { StartupProfile } from './matchTaxonomy';

const example: StartupProfile = { id: 'esempio', nome: 'Esempio', oneLiner: '', founder: '', email: '', ...EXAMPLE_STARTUP_CORE };
const exampleInvestor = DEMO_INVESTORS.find((i) => i.id === EXAMPLE_INVESTOR_ID)!;

describe('scoring rules table', () => {
  it('covers every weighted part once, in the shown order', () => {
    expect(SCORING_RULES.map((r) => r.part)).toEqual([...PART_ORDER]);
    expect([...PART_ORDER].sort()).toEqual(Object.keys(WEIGHTS).sort());
  });

  it('uses the real maxima, which sum to 100', () => {
    for (const r of SCORING_RULES) expect(r.max).toBe(WEIGHTS[r.part]);
    expect(SCORING_RULES.reduce((s, r) => s + r.max, 0)).toBe(100);
  });

  it('lists the real tier points, the best tier being the maximum', () => {
    const tiers = Object.fromEntries(SCORING_RULES.map((r) => [r.part, r.tiers.map((t) => t.points)]));
    expect(tiers.settore).toEqual([SETTORE_POINTS.principale, SETTORE_POINTS.secondario, SETTORE_POINTS.generalista]);
    expect(tiers.fase).toEqual([FASE_POINTS.principale, FASE_POINTS.secondaria]);
    expect(tiers.area).toEqual([AREA_POINTS.stessaRegione, AREA_POINTS.area, AREA_POINTS.italia]);
    for (const r of SCORING_RULES) expect(Math.max(...r.tiers.map((t) => t.points))).toBe(r.max);
  });

  it('band list follows SCORE_BANDS in both languages', () => {
    for (const locale of LOCALES) {
      const list = bandList(locale);
      for (const b of SCORE_BANDS) expect(list).toContain(`${MESSAGES[locale].match.bands[b.band]}`);
      for (const b of SCORE_BANDS) expect(list).toContain(String(b.min));
    }
  });
});

describe('breakdown of a pair', () => {
  it('adds up to the score of every eligible demo pair', () => {
    let eligible = 0;
    for (const s of DEMO_STARTUPS) {
      for (const i of DEMO_INVESTORS) {
        const b = breakdown(s, i);
        const e = evaluate(s, i);
        expect(b.evaluation.score).toBe(e.score);
        if (e.eligible) {
          eligible++;
          expect(Math.round(b.raw)).toBe(e.score);
          expect(b.rows.every((r) => r.passes)).toBe(true);
        } else {
          expect(b.rows.filter((r) => !r.passes).map((r) => r.part).sort()).toEqual([...e.failed].sort());
        }
        for (const r of b.rows) {
          expect(r.points).toBeGreaterThanOrEqual(0);
          expect(r.points).toBeLessThanOrEqual(r.max);
        }
      }
    }
    expect(eligible).toBeGreaterThan(5);
  });

  it('names the rule that gave the points', () => {
    for (const s of DEMO_STARTUPS) {
      for (const i of DEMO_INVESTORS) {
        for (const r of breakdown(s, i).rows) {
          if (!r.passes || r.part === 'ticket') continue;
          const tier = SCORING_RULES.find((x) => x.part === r.part)!.tiers.find((t) => t.rule === r.rule);
          expect(tier?.points, `${s.id}/${i.id} ${r.part}`).toBe(r.points);
        }
      }
    }
  });

  it('ticket is full from LEAD_COVERAGE upwards and proportional below', () => {
    const full = breakdown({ ...example, round: exampleInvestor.ticketMax / LEAD_COVERAGE }, exampleInvestor);
    expect(full.rows.find((r) => r.part === 'ticket')).toMatchObject({ rule: 'pieno', points: WEIGHTS.ticket });
    const part = breakdown(example, exampleInvestor).rows.find((r) => r.part === 'ticket')!;
    expect(part.rule).toBe('parziale');
    expect(part.points).toBeCloseTo((WEIGHTS.ticket * (exampleInvestor.ticketMax / example.round)) / LEAD_COVERAGE);
  });

  it('gives no points to a part whose filter fails', () => {
    const b = breakdown({ ...example, round: 150_000 }, exampleInvestor);
    expect(b.evaluation.eligible).toBe(false);
    expect(b.rows.find((r) => r.part === 'ticket')).toMatchObject({ passes: false, points: 0 });
  });

  it('a results card shows the same breakdown as the explainer page', () => {
    const { matches } = matchInvestors(example, DEMO_INVESTORS);
    for (const m of matches) expect(breakdown(example, m.item, 'it', m.evaluation)).toEqual(breakdown(example, m.item));
  });
});

describe('the interactive example', () => {
  it('starts from an eligible pair where no part scores full marks', () => {
    const b = breakdown(example, exampleInvestor);
    expect(b.evaluation.eligible).toBe(true);
    for (const r of b.rows) {
      expect(r.points).toBeGreaterThan(0);
      expect(r.points).toBeLessThan(r.max);
    }
  });

  it('offers rounds that both pass and fail the ticket filter', () => {
    expect(EXAMPLE_ROUNDS).toContain(EXAMPLE_STARTUP_CORE.round);
    const results = EXAMPLE_ROUNDS.map((round) => evaluate({ ...example, round }, exampleInvestor).eligible);
    expect(results).toContain(true);
    expect(results).toContain(false);
  });
});

describe('explainer copy', () => {
  it('takes every number as a parameter (prototype rules, ticket threshold)', () => {
    for (const locale of LOCALES) {
      const x = MESSAGES[locale].explain;
      expect(x.rules.cap(MONTHLY_PROPOSAL_LIMIT)).toContain(String(MONTHLY_PROPOSAL_LIMIT));
      expect(x.rules.expiry(REQUEST_EXPIRY_DAYS)).toContain(String(REQUEST_EXPIRY_DAYS));
      expect(x.breakdown.ticket.parziale('27%', '40%')).toContain('40%');
      // No digits written into static sentences: they would drift from the constants.
      const statics = [x.lead, x.filtersLead, ...Object.values(x.filters), x.scoreLead, x.tieBreak, ...x.near, ...x.not, x.rules.placeholder];
      for (const s of statics) expect(s, s).not.toMatch(/\d/);
    }
  });
});
