import { describe, expect, it } from 'vitest';
import {
  BRANCH_STEPS,
  demoCast,
  frameAt,
  investorAnswers,
  nextPosition,
  parsePosition,
  positionToQuery,
  prevPosition,
  SHARED_STEPS,
  STEP_COUNT,
  stepIdOf,
  withBranch,
  type DemoBranch,
  type DemoPosition,
} from './guidedDemo';
import { emptyStore } from './inbox';
import { REQUEST_EXPIRY_DAYS } from './matchConfig';

const LOCALES = ['it', 'en'] as const;
const BRANCHES: DemoBranch[] = ['yes', 'no'];
const all = (branch: DemoBranch): DemoPosition[] => Array.from({ length: STEP_COUNT }, (_, k) => ({ step: k + 1, branch }));

describe('guided demo: cast', () => {
  it('reads the profile from the fictional sample deck with the real extractor, and has matches', () => {
    expect(demoCast('it').core).toEqual({ settore: 'agritech', fase: 'seed', regione: 'puglia', round: 800_000 });
    expect(demoCast('en').core).toEqual({ settore: 'healthtech', fase: 'seed', regione: 'campania', round: 1_200_000 });
    for (const l of LOCALES) {
      const c = demoCast(l);
      expect(c.matches.length).toBeGreaterThan(1);
      expect(c.investor.id).toBe(c.matches[0]!.item.id);
    }
  });
});

describe('guided demo: navigation and deep links', () => {
  it('parses ?step and ?branch, falling back on junk', () => {
    expect(parsePosition(new URLSearchParams('step=3'))).toEqual({ step: 3, branch: 'yes' });
    expect(parsePosition(new URLSearchParams('step=6&branch=no'))).toEqual({ step: 6, branch: 'no' });
    for (const q of ['', 'step=0', 'step=7', 'step=2.5', 'step=x', 'branch=maybe']) {
      expect(parsePosition(new URLSearchParams(q)).step).toBe(1);
      expect(parsePosition(new URLSearchParams(q)).branch).toBe('yes');
    }
  });

  it('round-trips positions through the query string; step 1 is the clean URL', () => {
    expect(positionToQuery({ step: 1, branch: 'yes' })).toBeNull();
    for (const b of BRANCHES)
      for (const p of all(b)) {
        const q = positionToQuery(p);
        if (q) expect(parsePosition(new URLSearchParams(q))).toEqual(p);
      }
  });

  it('steps forward and back within a branch, and stops at the ends', () => {
    expect(prevPosition({ step: 1, branch: 'yes' })).toBeNull();
    expect(nextPosition({ step: STEP_COUNT, branch: 'no' })).toBeNull();
    expect(nextPosition({ step: 4, branch: 'no' })).toEqual({ step: 5, branch: 'no' });
    expect(prevPosition({ step: 5, branch: 'yes' })).toEqual({ step: 4, branch: 'yes' });
    expect(withBranch({ step: 5, branch: 'yes' }, 'no')).toEqual({ step: 5, branch: 'no' });
    expect(all('yes').map(stepIdOf)).toEqual([...SHARED_STEPS, ...BRANCH_STEPS.yes]);
    expect(all('no').map(stepIdOf)).toEqual([...SHARED_STEPS, ...BRANCH_STEPS.no]);
  });
});

describe('guided demo: the story, with the real inbox', () => {
  for (const l of LOCALES) {
    const cast = demoCast(l);
    const f = (step: number, branch: DemoBranch = 'yes') => frameAt({ step, branch }, cast);

    it(`shared steps are identical in both branches (${l})`, () => {
      for (let s = 1; s <= SHARED_STEPS.length; s++) {
        const { silentFounderView, ...no } = f(s, 'no');
        const { silentFounderView: none, ...yes } = f(s, 'yes');
        expect(no).toEqual({ ...yes, branch: 'no' });
        expect(none).toBeNull();
        expect(silentFounderView).toEqual(no.founderView);
      }
    });

    it(`profile and matches: nothing sent yet (${l})`, () => {
      expect(f(1).store.profile).toEqual(cast.core);
      for (const s of [1, 2]) {
        expect(f(s).request).toBeNull();
        expect(f(s).founderView).toBeNull();
        expect(f(s).investorView).toBeNull();
      }
    });

    it(`propose: the founder waits; the teaser reaches the investor the next day, anonymous (${l})`, () => {
      expect(f(3).founderView).toMatchObject({ status: 'waiting', daysLeft: REQUEST_EXPIRY_DAYS, knowsName: true });
      expect(f(3).investorView).toBeNull();
      expect(f(4).investorView).toMatchObject({ status: 'your-turn', knowsName: false });
      expect(f(4).focus).toBe('investor');
    });

    it(`yes branch: interested → the founder is asked → both yes → intro, names revealed to both (${l})`, () => {
      expect(f(5).request!.state).toBe('attesa-startup');
      expect(f(5).founderView!.status).toBe('your-turn');
      expect(f(5).investorView).toMatchObject({ status: 'waiting', knowsName: false });
      expect(f(6).request!.state).toBe('intro');
      expect(f(6).founderView).toMatchObject({ status: 'intro', knowsName: true });
      expect(f(6).investorView).toMatchObject({ status: 'intro', knowsName: true });
    });

    it(`no branch: the founder sees exactly what "no answer yet" looks like, then "expired" (${l})`, () => {
      const declined = f(5, 'no');
      expect(declined.request!.state).toBe('chiusa-investitore');
      expect(declined.founderView).toEqual(declined.silentFounderView);
      expect(declined.founderView).toMatchObject({ status: 'waiting', group: 'pending' });
      expect(declined.founderView!.daysLeft).toBe(f(4).founderView!.daysLeft! - 2);
      const expired = f(6, 'no');
      expect(expired.founderView).toEqual(expired.silentFounderView);
      expect(expired.founderView).toMatchObject({ status: 'expired', group: 'expired' });
      // The investor never learns the startup's name in this branch.
      expect(declined.investorView!.knowsName).toBe(false);
      expect(expired.investorView!.knowsName).toBe(false);
    });

    it(`the investor never knows the name before the intro (${l})`, () => {
      for (const b of BRANCHES)
        for (const p of all(b)) {
          const fr = frameAt(p, cast);
          if (fr.id !== 'intro') expect(fr.investorView?.knowsName ?? false).toBe(false);
        }
    });

    it(`days move forward along each branch, and the store holds no names or texts (${l})`, () => {
      for (const b of BRANCHES) {
        const days = all(b).map((p) => frameAt(p, cast).day);
        expect([...days].sort((a, z) => a - z)).toEqual(days);
        expect(JSON.stringify(frameAt({ step: STEP_COUNT, branch: b }, cast).store)).not.toMatch(/"(nome|founder|oneLiner|email)":/);
      }
    });
  }

  it('investorAnswers ignores unknown requests and leaves the founder role in place', () => {
    expect(investorAnswers(emptyStore(), 'nope', 'yes', 0)).toEqual(emptyStore());
    const fr = frameAt({ step: 5, branch: 'yes' }, demoCast('it'));
    expect(fr.request!.role).toBe('founder');
  });
});
