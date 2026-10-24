import { describe, expect, it } from 'vitest';
import { MESSAGES } from './messages';

type Shape = string | Shape[] | { [k: string]: Shape };

/** Structure of a dictionary: keys (deep), array lengths, leaf kinds and function arity. */
function shape(value: unknown): Shape {
  if (typeof value === 'function') return `fn/${value.length}`;
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, shape((value as Record<string, unknown>)[k])]),
    );
  }
  return typeof value;
}

function leaves(value: unknown, prefix = ''): [string, unknown][] {
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k));
  }
  return [[prefix, value]];
}

describe('dictionaries', () => {
  it('have exactly the same keys, array lengths and function signatures in it and en', () => {
    expect(shape(MESSAGES.en)).toEqual(shape(MESSAGES.it));
  });

  it('cover every area of the site, including quiz and matching strings', () => {
    expect(Object.keys(MESSAGES.it).sort()).toEqual(['common', 'directory', 'equity', 'exportDoc', 'home', 'intake', 'match', 'matchDemo', 'privacy', 'quiz', 'variants', 'vesting']);
    expect(Object.keys(MESSAGES.en.quiz.questions)).toHaveLength(7);
    expect(Object.keys(MESSAGES.en.match.reasons.startup)).toEqual(Object.keys(MESSAGES.it.match.reasons.startup));
  });

  it('have no empty English strings where the Italian one is filled', () => {
    const en = new Map(leaves(MESSAGES.en));
    for (const [key, value] of leaves(MESSAGES.it)) {
      if (typeof value === 'string' && value !== '') expect(en.get(key), key).not.toBe('');
    }
  });

  it('use the required disclaimers', () => {
    expect(MESSAGES.it.common.disclaimer).toBe('Strumento indicativo: non sostituisce una consulenza legale.');
    expect(MESSAGES.en.common.disclaimer).toBe('Indicative tool: not a substitute for legal advice.');
    expect(MESSAGES.en.match.demoLabel).toBe('Sample data');
  });

  it('never brand anything with assistant names', () => {
    const all = JSON.stringify(leaves(MESSAGES.it).concat(leaves(MESSAGES.en)).map(([, v]) => (typeof v === 'string' ? v : '')));
    expect(all).not.toMatch(/grok|claude/i);
  });
});
