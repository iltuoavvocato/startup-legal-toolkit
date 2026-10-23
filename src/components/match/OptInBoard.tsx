import type { ReactNode } from 'react';
import type { Investor, StartupProfile } from '../../lib/matchTaxonomy';
import { useI18n } from '../../i18n/context';
import { labelsFor } from '../../lib/matchTaxonomy';
import { introEmail, teaserOf, viewFor, type OptInEvent, type OptInState, type Side, type SideView } from '../../lib/optin';
import { IntroEmailPreview } from './IntroEmailPreview';
import { LockIcon, TeaserCard } from './TeaserCard';

interface Props {
  state: OptInState;
  startup: StartupProfile;
  investor: Investor;
  onEvent: (e: OptInEvent) => void;
}

const investorSaidYes = (s: OptInState) => s === 'attesa-startup' || s === 'chiusa-startup' || s === 'intro';

/**
 * The "doppia chiave": the investor and startup views side by side, joined by a connector.
 * Each yes lights one half; the intro appears only when both halves are lit.
 */
export function OptInBoard({ state, startup, investor, onEvent }: Props) {
  const { locale, t } = useI18n();
  const investorKey = investorSaidYes(state) ? 'on' : state === 'chiusa-investitore' ? 'off' : 'idle';
  const startupKey = state === 'intro' ? 'on' : state === 'chiusa-startup' ? 'off' : 'idle';

  return (
    <div className={`mi-board state-${state}`}>
      <Panel side="investitore" view={viewFor(state, 'investitore', locale)} who={investor.nome} onEvent={onEvent}>
        <TeaserCard teaser={teaserOf(startup, locale)} label={t.match.ui.board.teaserLabel} />
      </Panel>

      <div className="mi-connector" aria-hidden="true">
        <span className={`mi-key key-${investorKey}`} />
        <span className="mi-lock">
          <LockIcon />
        </span>
        <span className={`mi-key key-${startupKey}`} />
      </div>

      <Panel side="startup" view={viewFor(state, 'startup', locale)} who={startup.nome} onEvent={onEvent}>
        <div className="mi-investor-card">
          <p className="mi-investor-name">{investor.nome}</p>
          <p className="mi-investor-type">
            {t.match.ui.board.investorType(labelsFor(locale).tipo[investor.tipo], investor.referente)}
          </p>
          <p>{investor.tesi}</p>
        </div>
      </Panel>

      {state === 'intro' && (
        <div className="mi-board-intro">
          <IntroEmailPreview email={introEmail(startup, investor, locale)} />
        </div>
      )}
    </div>
  );
}

interface PanelProps {
  side: Side;
  view: SideView;
  who: string;
  onEvent: (e: OptInEvent) => void;
  children: ReactNode;
}

function Panel({ side, view, who, onEvent, children }: PanelProps) {
  const { t } = useI18n();
  const title = side === 'investitore' ? t.match.ui.board.investorView : t.match.ui.board.startupView;
  const headingId = `panel-${side}`;
  return (
    <section className={`mi-panel panel-${side} kind-${view.kind}`} aria-labelledby={headingId}>
      <header className="mi-panel-head">
        <h3 id={headingId}>{title}</h3>
        <span className="mi-panel-who">{who}</span>
      </header>
      <p className="mi-panel-title">{view.titolo}</p>
      <p className="mi-panel-text">{view.testo}</p>
      {(view.kind === 'teaser' || view.kind === 'richiesta') && children}
      {view.azioni.length > 0 && (
        <div className="mi-panel-actions">
          {view.azioni.map((a) => (
            <button
              key={a.event}
              type="button"
              className={`btn ${a.variant === 'primary' ? 'btn-navy' : 'btn-outline'}`}
              onClick={() => onEvent(a.event)}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
