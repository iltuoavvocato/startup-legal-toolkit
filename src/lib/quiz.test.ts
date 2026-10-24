import { describe, expect, it } from 'vitest';
import { QUESTIONS, checklistText, getQuestions, getRecommendations, isComplete, type Answers, type DocumentId } from './quiz';

const base: Answers = {
  fondatori: 'solo',
  societa: 'srl',
  accordi: 'si',
  investimenti: 'no',
  equity: 'no',
  ip: 'no',
  uscita: 'si',
};

const find = (answers: Answers, id: DocumentId) => getRecommendations({ ...base, ...answers }).find((r) => r.id === id);

describe('getRecommendations', () => {
  it('returns nothing for a solo founder with no investors, collaborators or IP issues', () => {
    expect(getRecommendations(base)).toEqual([]);
  });

  it('does not suggest patti tra fondatori to a solo founder without investors', () => {
    expect(find({ accordi: 'no', uscita: 'no' }, 'patti')).toBeUndefined();
  });

  it('marks SAFE as prioritario when investors are expected', () => {
    expect(find({ investimenti: 'si' }, 'safe')?.priority).toBe('prioritario');
    expect(find({ investimenti: 'forse' }, 'safe')?.priority).toBe('consigliato');
    expect(find({ investimenti: 'no' }, 'safe')).toBeUndefined();
  });

  it('mentions incorporation when investors are expected before the company exists', () => {
    const safe = find({ investimenti: 'si', societa: 'no' }, 'safe');
    expect(safe?.why).toContain('costituita');
    expect(safe?.triggers.map((t) => t.answer)).toContain('No, non ancora');
  });

  it('suggests work for equity for equity collaborators', () => {
    expect(find({ equity: 'si' }, 'wfe')?.priority).toBe('prioritario');
    expect(find({ equity: 'si' }, 'ip')?.priority).toBe('consigliato');
    expect(find({ equity: 'no' }, 'wfe')).toBeUndefined();
  });

  it('marks IP assignment as prioritario for pre-existing assets', () => {
    expect(find({ ip: 'si' }, 'ip')?.priority).toBe('prioritario');
    expect(find({ ip: 'nonso' }, 'ip')?.priority).toBe('consigliato');
  });

  it('marks vesting as prioritario for 2+ founders without an exit rule', () => {
    expect(find({ fondatori: 'due', uscita: 'no' }, 'vesting')?.priority).toBe('prioritario');
    expect(find({ fondatori: 'tre', uscita: 'no' }, 'vesting')?.priority).toBe('prioritario');
    expect(find({ fondatori: 'due', uscita: 'si' }, 'vesting')?.priority).toBe('valutare');
  });

  it('marks patti tra fondatori as prioritario when agreements are only verbal', () => {
    const patti = find({ fondatori: 'due', accordi: 'voce' }, 'patti');
    expect(patti?.priority).toBe('prioritario');
    expect(patti?.triggers).toContainEqual({ question: QUESTIONS[2]!.text, answer: 'Solo a voce' });
    expect(find({ fondatori: 'due', accordi: 'si' }, 'patti')?.priority).toBe('valutare');
    expect(find({ fondatori: 'due', accordi: 'si', investimenti: 'si' }, 'patti')?.priority).toBe('consigliato');
  });

  it('sorts by priority and only uses the five allowed documents', () => {
    const recs = getRecommendations({
      fondatori: 'tre',
      societa: 'no',
      accordi: 'si',
      investimenti: 'si',
      equity: 'si',
      ip: 'si',
      uscita: 'si',
    });
    const ranks = { prioritario: 0, consigliato: 1, valutare: 2 };
    for (let i = 1; i < recs.length; i++) {
      expect(ranks[recs[i]!.priority]).toBeGreaterThanOrEqual(ranks[recs[i - 1]!.priority]);
    }
    expect(new Set(recs.map((r) => r.id))).toEqual(new Set(['patti', 'vesting', 'safe', 'wfe', 'ip']));
    recs.forEach((r) => expect(r.triggers.length).toBeGreaterThan(0));
  });
});

describe('isComplete and checklistText', () => {
  it('detects missing or invalid answers', () => {
    expect(isComplete(base)).toBe(true);
    expect(isComplete({ ...base, ip: undefined })).toBe(false);
    expect(isComplete({ ...base, ip: 'boh' })).toBe(false);
  });

  it('produces a plain-text checklist with the disclaimer', () => {
    const text = checklistText(getRecommendations({ ...base, investimenti: 'si' }));
    expect(text).toContain('[Prioritario] SAFE');
    expect(text).toContain('Strumento indicativo: non sostituisce una consulenza legale.');
    expect(checklistText([])).toContain('nessun documento');
  });
});

describe('English quiz content', () => {
  it('asks the same questions with the same option values', () => {
    const it_ = getQuestions('it');
    const en = getQuestions('en');
    expect(en.map((q) => q.id)).toEqual(it_.map((q) => q.id));
    expect(en.map((q) => q.options.map((o) => o.value))).toEqual(it_.map((q) => q.options.map((o) => o.value)));
    expect(en[0]!.text).toBe('How many of you are founding the startup?');
  });

  it('gives the same recommendations, in English', () => {
    const answers: Answers = { ...base, fondatori: 'tre', accordi: 'voce', investimenti: 'si', societa: 'no', uscita: 'no' };
    const itRecs = getRecommendations(answers);
    const enRecs = getRecommendations(answers, 'en');
    expect(enRecs.map((r) => [r.id, r.priority])).toEqual(itRecs.map((r) => [r.id, r.priority]));
    expect(enRecs.find((r) => r.id === 'patti')?.title).toBe('Founders’ agreement');
    expect(enRecs.find((r) => r.id === 'safe')?.why).toContain('To use it, the company usually needs to be incorporated already.');
    expect(enRecs.find((r) => r.id === 'patti')?.triggers).toContainEqual({
      question: 'Have you put in writing how equity and roles are split?',
      answer: 'Only verbally',
    });
  });

  it('writes the English checklist with the English disclaimer', () => {
    const text = checklistText(getRecommendations({ ...base, investimenti: 'si' }, 'en'), 'en');
    expect(text).toContain('[Priority] SAFE (or an equivalent investor instrument)');
    expect(text.endsWith('Indicative tool: not a substitute for legal advice.')).toBe(true);
  });
});
