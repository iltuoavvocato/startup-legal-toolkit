import type { Locale } from '../locales';
import common from './common';
import equity from './equity';
import home from './home';
import match from './match';
import matchDemo from './matchDemo';
import privacy from './privacy';
import quiz from './quiz';
import variants from './variants';
import vesting from './vesting';

const modules = { common, home, equity, vesting, quiz, privacy, match, matchDemo, variants };

type Modules = typeof modules;
export type Messages = { [K in keyof Modules]: Modules[K]['it'] };

function pick(locale: Locale): Messages {
  return Object.fromEntries(Object.entries(modules).map(([k, m]) => [k, m[locale]])) as Messages;
}

export const MESSAGES: Record<Locale, Messages> = { it: pick('it'), en: pick('en') };
