import { useCallback, useEffect, useRef, useState } from 'react';
import { CtaPanel } from '../components/CtaPanel';
import { Disclaimer } from '../components/Disclaimer';
import { PageHero } from '../components/PageHero';
import { AgentConversation } from '../components/match/agent/AgentConversation';
import { AgentSummary } from '../components/match/agent/AgentSummary';
import { useIntake } from '../components/match/agent/useIntake';
import { LiveRegion } from '../components/match/LiveRegion';
import { ModeSwitch } from '../components/match/ModeSwitch';
import { PrototypeBanner } from '../components/match/PrototypeBanner';
import { useDeckReader } from '../components/match/useDeckReader';
import { useI18n } from '../i18n/context';
import { Rich } from '../i18n/Rich';
import type { IntakeMode } from '../lib/intakeAgent';

/** "Parla con l'agente": guided intake for founders or investors, then matches explained by the agent. */
function MatchAgentPage({ mode }: { mode: IntakeMode }) {
  const { t } = useI18n();
  const u = t.intake.ui;
  const side = mode === 'startup' ? u.startup : u.investor;
  const formPage = mode === 'startup' ? t.match.ui.startup : t.match.ui.investor;
  const { state, dispatch } = useIntake(mode);
  const reader = useDeckReader();
  const [message, setMessage] = useState('');
  const [summaryFocus, setSummaryFocus] = useState(0);
  const interacted = useRef(false);
  const userDispatch = useCallback(
    (a: Parameters<typeof dispatch>[0]) => {
      interacted.current = true;
      dispatch(a);
    },
    [dispatch],
  );

  // The deck is read on the device; only the findings reach the conversation (never stored).
  const read = reader.state;
  useEffect(() => {
    if (read.status === 'ready') dispatch({ type: 'DECK_READY', pages: read.pages, findings: read.findings });
    else if (read.status === 'error') dispatch({ type: 'DECK_ERROR', code: read.code, pages: read.pages });
  }, [read, dispatch]);

  const restart = () => {
    reader.reset();
    dispatch({ type: 'RESTART' });
    setMessage(u.restartDone);
  };

  return (
    <>
      <PrototypeBanner />
      <PageHero eyebrow={side.eyebrow} title={<Rich text={side.title} />}>
        <p>{side.lead}</p>
      </PageHero>

      <section className="section section-cream tool-section">
        <div className="container">
          <LiveRegion message={message} />
          <ModeSwitch side={mode} current="agent" />
          <div className="mi-agent">
            <AgentConversation
              state={state}
              dispatch={dispatch}
              read={read}
              onDeckFile={(file) => {
                dispatch({ type: 'DECK_START' });
                void reader.read(file);
              }}
              onRestart={restart}
              onEditProfile={() => setSummaryFocus((n) => n + 1)}
              interacted={interacted}
            />
            <AgentSummary state={state} dispatch={userDispatch} focusSignal={summaryFocus} />
          </div>
          <p className="field-hint mi-agent-storage">{u.storageNote}</p>
          <Disclaimer />
          <CtaPanel campaign="match" title={formPage.ctaTitle} text={formPage.ctaText} />
        </div>
      </section>
    </>
  );
}

export function MatchAgentStartupPage() {
  return <MatchAgentPage mode="startup" />;
}

export function MatchAgentInvestorPage() {
  return <MatchAgentPage mode="investor" />;
}
