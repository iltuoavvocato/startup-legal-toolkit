import type { Locale } from '../locales';
import common from './common';
import directory from './directory';
import equity from './equity';
import exportDoc from './exportDoc';
import home from './home';
import intake from './intake';
import match from './match';
import matchDemo from './matchDemo';
import privacy from './privacy';
import quiz from './quiz';
import variants from './variants';
import vesting from './vesting';

const modules = { common, home, equity, vesting, quiz, privacy, match, matchDemo, intake, directory, exportDoc, variants };

type Modules = typeof modules;
export type Messages = { [K in keyof Modules]: Modules[K]['it'] };

function pick(locale: Locale): Messages {
  return Object.fromEntries(Object.entries(modules).map(([k, m]) => [k, m[locale]])) as Messages;
}

export const MESSAGES: Record<Locale, Messages> = { it: pick('it'), en: pick('en') };
