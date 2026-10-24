import { describe, expect, it } from 'vitest';
import { EXPORT_STORAGE_KEY, emptyExportStore, parseExportStore } from './exportDoc';
import { emptyStore, INBOX_STORAGE_KEY, parseStore } from './inbox';
import { initIntake, restore, serialize, STORAGE_KEYS } from './intakeAgent';
import { clearMatchStorage, MATCH_STORAGE_KEYS, safeGet, storageOf } from './matchStorage';

// Every stored-state loader must turn corrupt JSON, wrong shapes and missing keys into a clean state, never throw.
const JUNK = ['', '{', 'null', '0', '"x"', '[]', 'true', '{}', '{"v":1}', '{"v":1,"requests":"x"}', '\u0000￿', '{"__proto__":{"v":1}}'];

function memoryStorage(seed: Record<string, string> = {}): Storage {
  const m = new Map(Object.entries(seed));
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v)),
  };
}

const throwing = (): Storage => {
  throw new DOMException('denied', 'SecurityError');
};
const throwingOnUse = (): Storage =>
  ({
    getItem: () => {
      throw new DOMException('quota', 'QuotaExceededError');
    },
    removeItem: () => {
      throw new DOMException('denied', 'SecurityError');
    },
  }) as unknown as Storage;

describe('stored state loaders survive corrupt input', () => {
  it('inbox: junk, wrong shapes and bad requests give an empty or filtered inbox', () => {
    for (const raw of JUNK) expect(parseStore(raw)).toEqual(emptyStore());
    const s = parseStore(JSON.stringify({ v: 1, offsetDays: 'x', profile: [], requests: [null, 1, 'x', { id: 'r', role: 'founder' }] }));
    expect(s).toEqual(emptyStore());
  });

  it('export store: junk and wrong shapes give an empty store', () => {
    for (const raw of JUNK) expect(parseExportStore(raw)).toEqual(emptyExportStore());
    const odd = parseExportStore(JSON.stringify({ v: 1, startup: 'x', investor: { thesis: 5 } }));
    expect(odd.startup).toBeNull();
    expect(odd.investor).toBeNull();
    const bad = parseExportStore(JSON.stringify({ v: 1, startup: { core: { settore: 'crypto' }, traction: 'x' }, investor: [] }));
    expect(bad.startup).toBeNull();
    expect(bad.investor).toBeNull();
  });

  it('agent conversation: junk and wrong shapes are not restored', () => {
    for (const raw of JUNK) {
      expect(restore(raw, 'startup')).toBeNull();
      expect(restore(raw, 'investor')).toBeNull();
    }
    const ok = JSON.parse(serialize(initIntake('startup'))) as Record<string, unknown>;
    expect(restore(JSON.stringify(ok), 'startup')).not.toBeNull();
    const broken: Record<string, unknown>[] = [
      { messages: [null] },
      { messages: [{ id: 1, from: 'agent', body: { kind: 'nope' } }] },
      { messages: [{ id: 1, from: 'agent', body: { kind: 'match' } }] },
      { messages: [{ id: 1, from: 'robot', body: { kind: 'hello' } }] },
      { messages: [{ id: 'x', from: 'agent', body: { kind: 'hello' } }] },
      { messages: 'hello' },
      { deck: { status: 'exploded' } },
      { deck: { status: 'read', signals: 'x' } },
      { deck: { status: 'read', signals: [{ kind: 'traction', page: 1 }] } },
      { deck: { status: 'none', decisions: [] } },
      { phase: 'done' },
      { current: 42 },
      { editing: {} },
      { passed: [1] },
      { sources: 'x' },
      { answers: [] },
      { answers: null },
      { nextId: Infinity },
      { nextId: undefined },
    ];
    for (const patch of broken) expect(restore(JSON.stringify({ ...ok, ...patch }), 'startup'), JSON.stringify(patch)).toBeNull();
  });

  it('agent conversation: a missing optional field falls back to its default', () => {
    const ok = JSON.parse(serialize(initIntake('investor'))) as Record<string, unknown>;
    delete ok.passed;
    delete ok.sources;
    delete ok.editing;
    const back = restore(JSON.stringify(ok), 'investor')!;
    expect(back.passed).toEqual([]);
    expect(back.sources).toEqual({});
    expect(back.editing).toBeNull();
  });
});

describe('matchStorage', () => {
  it('lists exactly the keys the matching modules write', () => {
    expect([...MATCH_STORAGE_KEYS].sort()).toEqual([INBOX_STORAGE_KEY, EXPORT_STORAGE_KEY, ...Object.values(STORAGE_KEYS)].sort());
  });

  it('reads safely when storage is missing, disabled or throws', () => {
    expect(storageOf(throwing)).toBeNull();
    expect(storageOf(() => null)).toBeNull();
    expect(safeGet('k', throwing)).toBeNull();
    expect(safeGet('k', throwingOnUse)).toBeNull();
    expect(safeGet('k', () => memoryStorage({ k: 'v' }))).toBe('v');
  });

  it('clears only the demo keys and keeps the language preference', () => {
    const seed = Object.fromEntries(MATCH_STORAGE_KEYS.map((k) => [k, '{']));
    const session = memoryStorage({ ...seed, other: '1' });
    const local = memoryStorage({ ...seed, lang: 'en' });
    expect(clearMatchStorage([() => session, () => local])).toBe(true);
    expect(session.length).toBe(1);
    expect(session.getItem('other')).toBe('1');
    expect(local.length).toBe(1);
    expect(local.getItem('lang')).toBe('en');
  });

  it('reports false when no storage can be used, without throwing', () => {
    expect(clearMatchStorage([throwing, throwingOnUse])).toBe(false);
  });
});
