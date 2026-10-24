import { useCallback, useEffect, useState } from 'react';
import { demoInvestors, demoStartups } from '../../../data/matchDemo';
import { useI18n } from '../../../i18n/context';
import { tractionText } from '../../../lib/deckSignals';
import {
  initIntake,
  reduce,
  restore,
  resultIdsFor,
  serialize,
  startupCoreOf,
  STORAGE_KEYS,
  thesisOf,
  type Action,
  type IntakeMode,
  type IntakeState,
} from '../../../lib/intakeAgent';
import { withProfile } from '../../../lib/inbox';
import type { StartupCore } from '../../../lib/matchQuery';
import { saveInvestorSheet, saveStartupSheet } from '../useExportStore';
import { updateInbox } from '../useInbox';

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

const results = (s: IntakeState) => resultIdsFor(s, demoInvestors(), demoStartups());

/**
 * The conversation state, restored from and saved to sessionStorage (this tab only). The stored form never contains
 * the deck's text (see toStorable). "Ricomincia" removes the entry before starting again.
 */
export function useIntake(mode: IntakeMode) {
  const key = STORAGE_KEYS[mode];
  const [state, setState] = useState<IntakeState>(() => restore(storage()?.getItem(key) ?? null, mode) ?? initIntake(mode));

  useEffect(() => {
    try {
      storage()?.setItem(key, serialize(state));
    } catch {
      // Storage full or disabled: the conversation simply isn't kept across reloads.
    }
  }, [key, state]);

  // Once the founder's profile is complete, the directory and the requests inbox can use it (enumerated fields only).
  const core = mode === 'startup' && state.phase === 'results' ? startupCoreOf(state.answers) : null;
  const coreKey = core ? JSON.stringify(core) : '';
  useEffect(() => {
    if (coreKey) updateInbox((s) => withProfile(s, JSON.parse(coreKey) as StartupCore));
  }, [coreKey]);

  // The local export reads the same profile: enumerated fields, the founder's one-liner (typed, or the deck's cover
  // sentence once accepted) and the team / traction signals accepted from the deck. Never the deck's text.
  const { locale } = useI18n();
  const sheetKey = (() => {
    if (state.phase !== 'results') return '';
    if (mode === 'investor') {
      const thesis = thesisOf(state.answers);
      return thesis ? JSON.stringify({ thesis }) : '';
    }
    if (!core) return '';
    const team = state.deck.signals.find((x) => x.kind === 'team');
    const traction = state.deck.signals.flatMap((x) => (x.kind === 'traction' ? [tractionText(x.signal, locale)] : []));
    return JSON.stringify({ core, oneLiner: state.answers.oneLiner ?? null, team: team?.kind === 'team' ? team.count : null, traction });
  })();
  useEffect(() => {
    if (!sheetKey) return;
    const x = JSON.parse(sheetKey) as Parameters<typeof saveStartupSheet>[0] & Parameters<typeof saveInvestorSheet>[0];
    if (mode === 'investor') saveInvestorSheet({ source: 'agent', thesis: x.thesis });
    else saveStartupSheet({ ...x, source: 'agent' });
  }, [mode, sheetKey]);

  const dispatch = useCallback((action: Action) => {
    if (action.type === 'RESTART') {
      try {
        storage()?.removeItem(key);
      } catch {
        // ignore
      }
    }
    setState((s) => reduce(s, action, results));
  }, [key]);

  return { state, dispatch };
}
