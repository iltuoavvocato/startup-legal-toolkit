import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CtaPanel } from '../components/CtaPanel';
import { Disclaimer } from '../components/Disclaimer';
import { PageHero } from '../components/PageHero';
import { DemoBadge } from '../components/match/DemoBadge';
import { IntroEmailPreview } from '../components/match/IntroEmailPreview';
import { LegalLimits } from '../components/match/LegalLimits';
import { LiveRegion } from '../components/match/LiveRegion';
import { PrototypeBanner } from '../components/match/PrototypeBanner';
import { TeaserCard } from '../components/match/TeaserCard';
import { resetInbox, updateInbox, useInbox } from '../components/match/useInbox';
import { resetExportStore } from '../components/match/useExportStore';
import { ExportLink } from '../components/match/ExportLink';
import { DEMO_STARTUPS, demoInvestors, demoStartups, EXAMPLE_STARTUP_FORM } from '../data/matchDemo';
import { useI18n } from '../i18n/context';
import {
  answer,
  DAY_MS,
  groupRequests,
  proposalCounter,
  propose,
  seedInvestorInbox,
  timeTravel,
  viewOf,
  withProfile,
  type InboxRequest,
  type InboxRole,
  type InboxStore,
  type RequestGroup,
  type SimAnswer,
} from '../lib/inbox';
import { MONTHLY_PROPOSAL_LIMIT, REQUEST_EXPIRY_DAYS, TIME_TRAVEL_DAYS } from '../lib/matchConfig';
import { matchInvestors } from '../lib/matching';
import { ownStartup, type StartupCore } from '../lib/matchQuery';
import { labelsFor } from '../lib/matchTaxonomy';
import { introEmail, teaserOf } from '../lib/optin';

const GROUPS: RequestGroup[] = ['pending', 'accepted', 'expired'];
const ROLES: InboxRole[] = ['founder', 'investor'];
const ROLE_PARAM: Record<InboxRole, string> = { founder: 'startup', investor: 'investitore' };

const EXAMPLE_CORE: StartupCore = {
  settore: EXAMPLE_STARTUP_FORM.settore,
  fase: EXAMPLE_STARTUP_FORM.fase,
  regione: EXAMPLE_STARTUP_FORM.regione,
  round: EXAMPLE_STARTUP_FORM.round,
};

/** Example: sample profile and three proposals to its best matches, sent 0, 3 and 6 days ago (demo clock). */
function loadExample(s: InboxStore, now: number, locale: 'it' | 'en'): InboxStore {
  let next = withProfile(s, s.profile ?? EXAMPLE_CORE);
  const best = matchInvestors(ownStartup(next.profile!, undefined, locale), demoInvestors(locale), locale).matches.slice(0, 3);
  best.forEach((m, k) => {
    const r = propose(next, m.item.id, now - (6 - 3 * k) * DAY_MS);
    if (r.ok) next = r.store;
  });
  return next;
}

export function MatchRequestsPage() {
  const { locale, t, f } = useI18n();
  const x = t.directory.inbox;
  const { store, now } = useInbox();
  const [params, setParams] = useSearchParams();
  const role: InboxRole = params.get('vista') === ROLE_PARAM.investor ? 'investor' : 'founder';
  const [message, setMessage] = useState('');
  const id = useId();
  const tabRefs = useRef<Record<InboxRole, HTMLButtonElement | null>>({ founder: null, investor: null });

  // The investor view comes with sample teasers of fictional startups (added once, on the demo clock).
  useEffect(() => {
    if (!store.requests.some((r) => r.role === 'investor')) {
      updateInbox((s, at) => seedInvestorInbox(s, DEMO_STARTUPS.map((x) => x.id), at));
    }
  }, [store]);

  const selectRole = (next: InboxRole) => {
    setParams(next === 'founder' ? {} : { vista: ROLE_PARAM[next] }, { replace: true, preventScrollReset: true });
  };
  const onTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const next = e.key === 'Home' ? 'founder' : e.key === 'End' ? 'investor' : role === 'founder' ? 'investor' : 'founder';
    selectRole(next);
    tabRefs.current[next]?.focus();
  };

  const groups = groupRequests(store, role, now);
  const founderEmpty = role === 'founder' && !store.requests.some((r) => r.role === 'founder');
  const counter = proposalCounter(store, now);

  const travel = () => {
    updateInbox((s) => timeTravel(s, TIME_TRAVEL_DAYS));
    setMessage(x.travelled(f.longDate(new Date(now + TIME_TRAVEL_DAYS * DAY_MS))));
  };
  const reset = () => {
    resetInbox();
    resetExportStore();
    setMessage(x.resetDone);
  };
  const respond = (r: InboxRequest, choice: SimAnswer) => {
    updateInbox((s, at) => answer(s, r.id, choice, at));
    if (r.role === 'founder') setMessage(choice === 'yes' ? x.accepted : x.declined);
    else setMessage(choice === 'yes' ? x.yesSent : x.noSent);
  };

  return (
    <>
      <PrototypeBanner />
      <PageHero eyebrow={x.eyebrow} title={x.title}>
        <p>{x.lead}</p>
      </PageHero>
      <section className="section-cream tool-section">
        <div className="container">
          <div className="mi-inbox-top">
            <div className="mi-inbox-tabs" role="tablist" aria-label={x.tabsLabel}>
              {ROLES.map((r) => (
                <button
                  key={r}
                  ref={(el) => {
                    tabRefs.current[r] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`${id}-tab-${r}`}
                  aria-selected={role === r}
                  aria-controls={`${id}-panel`}
                  tabIndex={role === r ? 0 : -1}
                  className={role === r ? 'is-active' : undefined}
                  onClick={() => selectRole(r)}
                  onKeyDown={onTabKey}
                >
                  {r === 'founder' ? x.tabFounder : x.tabInvestor}
                  <TabCount store={store} role={r} now={now} />
                </button>
              ))}
            </div>
            <DemoControls now={now} offset={store.offsetDays} onTravel={travel} onReset={reset} />
          </div>

          <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${role}`} className="mi-inbox-panel">
            {role === 'founder' ? (
              <FounderCounter used={counter.used} />
            ) : (
              <p className="mi-inbox-intro">
                {x.investor.intro} <DemoBadge />
              </p>
            )}
            <p className="mi-inbox-export">
              <ExportLink kind={role === 'founder' ? 'startup' : 'investor'} className="btn btn-text btn-sm" />
            </p>

            {founderEmpty ? (
              <FounderEmpty
                onExample={() => {
                  updateInbox((s, at) => loadExample(s, at, locale));
                  setMessage(x.exampleLoaded);
                }}
              />
            ) : (
              GROUPS.map((g) => (
                <section key={g} className="mi-inbox-group" aria-labelledby={`${id}-${g}`}>
                  <h2 id={`${id}-${g}`} className="mi-inbox-group-title">
                    {(role === 'founder' ? x.groupsFounder : x.groups)[g]}
                    <span className="mi-inbox-group-count">{groups[g].length}</span>
                  </h2>
                  {groups[g].length ? (
                    <ul className="mi-inbox-list">
                      {groups[g].map((r) => (
                        <li key={r.id}>
                          <RequestCard request={r} now={now} profile={store.profile} onAnswer={respond} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mi-inbox-empty">{x.emptyGroup[g]}</p>
                  )}
                </section>
              ))
            )}

            <p className="notice mi-inbox-rule">{x.noReveal}</p>
            <p className="field-hint">{x.storageNote}</p>
          </div>
          <LiveRegion message={message} />

          <LegalLimits headingId={`${id}-limits`} />
          <Disclaimer />
          <CtaPanel campaign="match" title={t.match.ui.landing.ctaTitle} text={t.match.ui.landing.ctaText} />
        </div>
      </section>
    </>
  );
}

function TabCount({ store, role, now }: { store: InboxStore; role: InboxRole; now: number }) {
  const { t } = useI18n();
  const n = store.requests.filter((r) => r.role === role && viewOf(r, now).status === 'your-turn').length;
  if (!n) return null;
  return (
    <span className="mi-badge">
      <span aria-hidden="true">{n}</span>
      <span className="sr-only">, {t.directory.nav.badgeSr(n)}</span>
    </span>
  );
}

function DemoControls({ now, offset, onTravel, onReset }: { now: number; offset: number; onTravel: () => void; onReset: () => void }) {
  const { t, f } = useI18n();
  const x = t.directory.inbox;
  return (
    <aside className="mi-inbox-demo" aria-label={x.demoTitle}>
      <p className="mi-inbox-demo-head">
        <span className="mi-inbox-demo-tag">{x.demoTag}</span>
        <strong>{x.demoTitle}</strong>
      </p>
      <p className="mi-inbox-demo-text">{x.demoText(REQUEST_EXPIRY_DAYS)}</p>
      <p className="mi-inbox-demo-date">
        {x.today(f.longDate(new Date(now)))} {offset > 0 && <span className="mi-muted">{x.offset(offset)}</span>}
      </p>
      <div className="mi-inbox-demo-actions">
        <button type="button" className="btn btn-navy btn-sm" onClick={onTravel}>
          {x.travel(TIME_TRAVEL_DAYS)}
        </button>
        <button type="button" className="btn btn-text btn-sm" onClick={onReset}>
          {x.reset}
        </button>
      </div>
    </aside>
  );
}

function FounderCounter({ used }: { used: number }) {
  const { t } = useI18n();
  const x = t.directory.inbox;
  const left = Math.max(0, MONTHLY_PROPOSAL_LIMIT - used);
  return (
    <div className="mi-counter mi-inbox-counter">
      <p className="mi-counter-text">
        <strong>{x.counter(used, MONTHLY_PROPOSAL_LIMIT)}</strong> <span className="pill mi-provv">{x.counterTag}</span>
      </p>
      <div
        className="progress mi-counter-bar"
        role="progressbar"
        aria-label={x.counterTitle}
        aria-valuemin={0}
        aria-valuemax={MONTHLY_PROPOSAL_LIMIT}
        aria-valuenow={Math.min(used, MONTHLY_PROPOSAL_LIMIT)}
        aria-valuetext={x.counter(used, MONTHLY_PROPOSAL_LIMIT)}
      >
        <span style={{ width: `${Math.min(100, (used / MONTHLY_PROPOSAL_LIMIT) * 100)}%` }} />
      </div>
      <p className="field-hint">{left > 0 ? x.counterLeft(left) : x.counterNone}</p>
    </div>
  );
}

function FounderEmpty({ onExample }: { onExample: () => void }) {
  const { t, path } = useI18n();
  const x = t.directory.inbox.founder;
  return (
    <div className="card mi-inbox-empty-card">
      <h2 className="card-title">{x.emptyTitle}</h2>
      <p>{x.emptyText}</p>
      <div className="mi-profile-actions">
        <Link to={path('matchDirectory')} className="btn btn-navy">
          {x.emptyDirectory}
        </Link>
        <Link to={path('matchStartup')} className="btn btn-outline">
          {x.emptyMatches}
        </Link>
      </div>
      <div className="mi-inbox-example">
        <button type="button" className="btn btn-text" onClick={onExample}>
          {x.example}
        </button>
        <p className="field-hint">{x.exampleHint}</p>
      </div>
    </div>
  );
}

interface CardProps {
  request: InboxRequest;
  now: number;
  profile: StartupCore | null;
  onAnswer: (r: InboxRequest, choice: SimAnswer) => void;
}

function RequestCard({ request: r, now, profile, onAnswer }: CardProps) {
  const { locale, t, f, path } = useI18n();
  const x = t.directory.inbox;
  const L = labelsFor(locale);
  const v = viewOf(r, now);
  const date = (ms: number) => f.longDate(new Date(ms));
  const when =
    v.group === 'pending' && v.daysLeft !== null ? (
      <span className={`mi-inbox-due${v.daysLeft <= 3 ? ' is-soon' : ''}`}>{x.expiresIn(v.daysLeft)}</span>
    ) : v.status === 'expired' && v.deadline !== null ? (
      <span className="mi-inbox-due is-closed">{x.expiredOn(date(v.deadline))}</span>
    ) : null;

  if (r.role === 'founder') {
    const investor = demoInvestors(locale).find((i) => i.id === r.counterpartId);
    if (!investor) return null;
    const c = x.founder;
    const copy = {
      waiting: [c.waitingTitle, c.waitingText],
      'your-turn': [c.yourTurnTitle, c.yourTurnText],
      intro: [c.introTitle, c.introText],
      expired: [c.expiredTitle, c.expiredText],
      'declined-by-you': [c.declinedTitle, c.declinedText],
    }[v.status];
    return (
      <article className={`mi-request status-${v.status}`}>
        <header className="mi-request-head">
          <div>
            <h3>{investor.nome}</h3>
            <p className="mi-request-meta">
              {L.tipo[investor.tipo]} · {x.sentOn(date(r.createdAt))}
            </p>
          </div>
          {when}
        </header>
        <p className="mi-request-status">
          <strong>{copy[0]}</strong> {copy[1]}
        </p>
        {v.status === 'intro' && profile && (
          <details className="details">
            <summary>{c.showEmail}</summary>
            <IntroEmailPreview email={introEmail(ownStartup(profile, undefined, locale), investor, locale)} />
          </details>
        )}
        <div className="mi-request-actions">
          {v.status === 'your-turn' && (
            <>
              <button type="button" className="btn btn-gold btn-sm" onClick={() => onAnswer(r, 'yes')}>
                {c.accept}
                <span className="sr-only">: {investor.nome}</span>
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => onAnswer(r, 'no')}>
                {c.decline}
                <span className="sr-only">: {investor.nome}</span>
              </button>
            </>
          )}
          <Link to={`${path('matchInvestorProfile')}?id=${encodeURIComponent(investor.id)}`} className="btn btn-text btn-sm">
            {c.profile}
            <span className="sr-only">{c.profileSr(investor.nome)}</span>
          </Link>
        </div>
      </article>
    );
  }

  const startup = demoStartups(locale).find((s) => s.id === r.counterpartId);
  if (!startup) return null;
  const c = x.investor;
  const copy = {
    waiting: [c.waitingTitle, c.waitingText],
    'your-turn': [c.yourTurnTitle, c.yourTurnText],
    intro: [c.introTitle(startup.nome), c.introText],
    expired: [c.expiredTitle, c.expiredText],
    'declined-by-you': [c.declinedTitle, c.declinedText],
  }[v.status];
  return (
    <article className={`mi-request status-${v.status}`}>
      <header className="mi-request-head">
        <div>
          <h3>{copy[0]}</h3>
          <p className="mi-request-meta">{x.receivedOn(date(r.createdAt))}</p>
        </div>
        {when}
      </header>
      {/* The startup stays anonymous until both say yes. */}
      {v.knowsName ? (
        <p className="mi-request-line">
          <strong>{startup.nome}</strong> · {startup.oneLiner}
        </p>
      ) : (
        <TeaserCard teaser={teaserOf(startup, locale)} />
      )}
      <p className="mi-request-status">{copy[1]}</p>
      {v.status === 'your-turn' && (
        <div className="mi-request-actions">
          <button type="button" className="btn btn-gold btn-sm" onClick={() => onAnswer(r, 'yes')}>
            {c.yes}
            <span className="sr-only">: {teaserOf(startup, locale).settore}, {x.receivedOn(date(r.createdAt))}</span>
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => onAnswer(r, 'no')}>
            {c.no}
            <span className="sr-only">: {teaserOf(startup, locale).settore}, {x.receivedOn(date(r.createdAt))}</span>
          </button>
        </div>
      )}
    </article>
  );
}
