import { describe, expect, it } from 'vitest';
import { demoInvestors, demoStartups, DEMO_INVESTORS, DEMO_STARTUPS } from '../data/matchDemo';
import { draftExtraction, validateDeck } from './deck';
import { evaluate, matchInvestors, scoreBand } from './matching';
import { ownStartup, thesisErrors } from './matchQuery';
import type { Investor, StartupProfile } from './matchTaxonomy';
import { consume, introEmail, stateSteps, teaserOf, viewFor } from './optin';

const startup: StartupProfile = {
  id: 'tu',
  nome: 'Test',
  settore: 'fintech',
  fase: 'seed',
  regione: 'lombardia',
  round: 500_000,
  oneLiner: 'A test startup.',
  founder: 'Test founder',
  email: 'founder@test.example',
};

const investor: Investor = {
  id: 'x1',
  nome: 'Perfect',
  tipo: 'micro-vc',
  settori: ['fintech'],
  fasi: ['seed'],
  ticketMin: 25_000,
  ticketMax: 100_000,
  aree: ['nord-ovest'],
  sede: 'lombardia',
  tesi: '',
  referente: '',
  email: '',
};

describe('English matching reasons', () => {
  it('formats reasons in English with en-GB numbers', () => {
    expect(evaluate(startup, investor, 'startup', 'en').reasons).toEqual([
      'Fintech is their main focus',
      'Ticket from €25,000 to €100,000: can cover up to 20% of the round',
      'Invests mainly at Seed stage',
      'Based in Lombardy, like you',
    ]);
  });

  it('phrases reasons for the investor side', () => {
    const e = evaluate(startup, { ...investor, settori: ['edtech', 'fintech'], sede: 'piemonte', ticketMax: 300_000 }, 'investitore', 'en');
    expect(e.reasons).toEqual([
      'Fintech: one of the sectors you follow',
      'Round of €500,000: you could lead it (up to 60%)',
      'Seed stage: your main stage',
      'Based in Lombardy (North-West)',
    ]);
  });

  it('explains exclusions in English', () => {
    const e = evaluate(
      startup,
      { ...investor, fasi: ['serie-a'], settori: ['edtech'], aree: ['sud-isole'], ticketMin: 600_000, ticketMax: 900_000 },
      'startup',
      'en',
    );
    expect(e.whyNot).toEqual([
      'Doesn’t invest at Seed stage (invests at: Series A)',
      'Doesn’t invest in Fintech',
      'Doesn’t invest in the North-West',
      'Minimum ticket of €600,000, above the round of €500,000',
    ]);
  });

  it('keeps scores and ordering identical across languages', () => {
    const itRes = matchInvestors(startup, DEMO_INVESTORS, 'it');
    const en = matchInvestors(startup, demoInvestors('en'), 'en');
    expect(en.matches.map((m) => [m.item.id, m.evaluation.score])).toEqual(itRes.matches.map((m) => [m.item.id, m.evaluation.score]));
    expect(en.excluded.map((m) => m.item.id)).toEqual(itRes.excluded.map((m) => m.item.id));
  });

  it('translates band labels', () => {
    expect(scoreBand(90, 'en').label).toBe('Strong fit');
    expect(scoreBand(70, 'en').label).toBe('Good fit');
    expect(scoreBand(10, 'en').label).toBe('Worth a look');
    expect(scoreBand(90).label).toBe('Molto affine');
  });
});

describe('English demo data, opt-in, deck and forms', () => {
  it('translates theses and one-liners but keeps fictional names', () => {
    const en = demoInvestors('en');
    expect(en.map((i) => i.nome)).toEqual(DEMO_INVESTORS.map((i) => i.nome));
    expect(en[0]!.tesi).not.toBe(DEMO_INVESTORS[0]!.tesi);
    expect(demoStartups('en').map((s) => s.nome)).toEqual(DEMO_STARTUPS.map((s) => s.nome));
    expect(demoStartups('en').every((s) => s.oneLiner.length <= 140)).toBe(true);
  });

  it('gives English opt-in views and the same "no is never revealed" invariant', () => {
    expect(viewFor('chiusa-investitore', 'startup', 'en')).toEqual(viewFor('proposta', 'startup', 'en'));
    expect(viewFor('chiusa-startup', 'investitore', 'en')).toEqual(viewFor('attesa-startup', 'investitore', 'en'));
    expect(viewFor('proposta', 'investitore', 'en').azioni.map((a) => a.label)).toEqual(['Yes, I’m interested', 'No, thanks']);
    expect(stateSteps('en').map((s) => s.label)).toEqual(['Proposal to the investor', 'Request to the startup', 'Intro']);
  });

  it('writes the English intro email and teaser', () => {
    const s = demoStartups('en')[0]!;
    const i = demoInvestors('en')[0]!;
    const email = introEmail(s, i, 'en');
    expect(email.oggetto).toBe('Intro: Contoverde ↔ Ardesia Ventures (via MatchInvStar)');
    expect(email.corpo[0]).toBe('Hi Giada Rinaldi, hi Elena Varisco,');
    expect(email.corpo.join(' ')).toContain('does not give investment advice');
    expect(teaserOf(s, 'en')).toEqual({
      settore: 'Fintech',
      regione: 'Lombardy',
      fase: 'Seed',
      importo: '€500,000',
      oneLiner: s.oneLiner,
    });
  });

  it('translates the limit, deck and form messages', () => {
    const r = consume({ month: '2026-10', used: 5 }, 5, 'en');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('You’ve reached the limit of 5 proposals for this month (placeholder value).');
    expect(validateDeck({ name: 'deck.pptx', type: '', size: 10 }, 'en')).toBe('Upload the deck as a PDF.');
    expect(draftExtraction({ settore: '', fase: '', regione: '', round: null, descrizione: '' }, null, 'en').oneLiner.value).toBe(
      'Software that simplifies a repetitive business process for Italian SMEs.',
    );
    expect(thesisErrors({ settori: [], fasi: ['seed'], ticketMin: 1, ticketMax: 2, aree: ['centro'] }, 'en')).toEqual({
      settori: 'Choose at least one sector.',
    });
    expect(ownStartup({ settore: 'fintech', fase: 'seed', regione: 'lazio', round: 1 }, undefined, 'en').nome).toBe('Your startup');
  });
});
