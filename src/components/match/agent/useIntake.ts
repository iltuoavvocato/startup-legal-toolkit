import { useCallback, useEffect, useState } from 'react';
import { demoInvestors, demoStartups } from '../../../data/matchDemo';
import {
  initIntake,
  reduce,
  restore,
  resultIdsFor,
  serialize,
  startupCoreOf,
  STORAGE_KEYS,
  type Action,
  type IntakeMode,
  type IntakeState,
} from '../../../lib/intakeAgent';
import { withProfile } from '../../../lib/inbox';
import type { StartupCore } from '../../../lib/matchQuery';
import { monthKey } from '../../../lib/optin';
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
  const [state, setState] = useState<IntakeState>(() => {
    const month = monthKey(new Date());
    return restore(storage()?.getItem(key) ?? null, mode, month) ?? initIntake(mode, month);
  });

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
