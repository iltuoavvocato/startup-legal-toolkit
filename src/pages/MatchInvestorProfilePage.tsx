import { useId, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CtaPanel } from '../components/CtaPanel';
import { Disclaimer } from '../components/Disclaimer';
import { PageHero } from '../components/PageHero';
import { DemoBadge } from '../components/match/DemoBadge';
import { FictionalNotice } from '../components/match/FictionalNotice';
import { LegalLimits } from '../components/match/LegalLimits';
import { LiveRegion } from '../components/match/LiveRegion';
import { PrototypeBanner } from '../components/match/PrototypeBanner';
import { ScoreMeter } from '../components/match/ScoreMeter';
import { updateInbox, useInbox } from '../components/match/useInbox';
import { demoInvestors } from '../data/matchDemo';
import { readQuery } from '../hooks/useQueryState';
import { useI18n } from '../i18n/context';
import { findInvestor, profileSummary, rangeText } from '../lib/directory';
import { activeProposal, proposalCounter, propose, viewOf } from '../lib/inbox';
import { MONTHLY_PROPOSAL_LIMIT } from '../lib/matchConfig';
import { evaluate } from '../lib/matching';
import { ownStartup, startupToQuery, YOUR_ID } from '../lib/matchQuery';
import { labelsFor, type Investor } from '../lib/matchTaxonomy';

export function MatchInvestorProfilePage() {
  const { locale, t, path } = useI18n();
  const d = t.directory.detail;
  const location = useLocation();
  const [investorId] = useState(() => readQuery().get('id'));
  const investor = findInvestor(demoInvestors(locale), investorId);
  // Back to the directory with the filters the visitor came from (passed as router state by the cards).
  const from = (location.state as { from?: unknown } | null)?.from;
  const backTo = `${path('matchDirectory')}${typeof from === 'string' && from.startsWith('?') ? from : ''}`;

  return (
    <>
      <PrototypeBanner />
      <PageHero eyebrow={d.eyebrow} title={investor ? investor.nome : d.notFoundTitle}>
        {investor ? <p>{investor.tesi}</p> : <p>{d.notFoundText}</p>}
      </PageHero>
      <section className="section-cream tool-section">
        <div className="container">
          <p className="mi-back">
            <Link to={backTo}>
              <span aria-hidden="true">←</span> {d.back}
            </Link>
          </p>
          <FictionalNotice />
          {investor && <ProfileBody investor={investor} />}
          <LegalLimits headingId="profile-limits" />
          <Disclaimer />
          <CtaPanel campaign="match" title={t.match.ui.landing.ctaTitle} text={t.match.ui.landing.ctaText} />
        </div>
      </section>
    </>
  );
}

function ProfileBody({ investor: i }: { investor: Investor }) {
  const { locale, t, path, f } = useI18n();
  const d = t.directory.detail;
  const L = labelsFor(locale);
  const id = useId();
  const { store, now } = useInbox();
  const [message, setMessage] = useState('');
  const [justSent, setJustSent] = useState(false);
  const profile = store.profile ? ownStartup(store.profile, undefined, locale) : null;
  const ev = profile ? evaluate(profile, i, 'startup', locale) : null;
  const active = activeProposal(store, i.id, now);
  const activeView = active ? viewOf(active, now) : null;
  const used = proposalCounter(store, now).used;

  const send = () => {
    let outcome: ReturnType<typeof propose> | null = null;
    updateInbox((s, at) => {
      outcome = propose(s, i.id, at);
      return outcome.ok ? outcome.store : s;
    });
    const r = outcome as ReturnType<typeof propose> | null;
    if (r?.ok) {
      setJustSent(true);
      setMessage(d.sentNow);
    } else if (r?.reason === 'limit') setMessage(d.limit(MONTHLY_PROPOSAL_LIMIT));
  };

  const fasi = i.fasi.map((x, k) => (k === 0 && i.fasi.length > 1 ? d.mainFase(L.fase[x]) : L.fase[x])).join(', ');
  const settori =
    i.settori === 'tutti'
      ? t.directory.dir.card.generalist
      : i.settori.map((s, k) => (k === 0 && i.settori.length > 1 ? d.mainSettore(L.settore[s]) : L.settore[s])).join(', ');
  const optInLink = profile
    ? `${path('matchOptIn')}?${new URLSearchParams({ s: YOUR_ID, i: i.id, ...startupToQuery(profile) }).toString()}`
    : `${path('matchOptIn')}?i=${encodeURIComponent(i.id)}`;

  return (
    <div className="mi-profile-layout">
      <div className="mi-profile-main">
        <article className="card mi-profile-card" aria-labelledby={`${id}-criteria`}>
          <div className="card-head">
            <h2 className="card-title" id={`${id}-criteria`}>
              {d.criteria}
            </h2>
            <DemoBadge />
          </div>
          <dl className="mi-profile-facts">
            <div>
              <dt>{d.tipo}</dt>
              <dd>{L.tipo[i.tipo]}</dd>
            </div>
            <div>
              <dt>{d.ticket}</dt>
              <dd>{rangeText(i.ticketMin, i.ticketMax, locale)}</dd>
            </div>
            <div>
              <dt>{d.fasi}</dt>
              <dd>{fasi}</dd>
            </div>
            <div>
              <dt>{d.settori}</dt>
              <dd>{settori}</dd>
            </div>
            <div>
              <dt>{d.aree}</dt>
              <dd>{i.aree === 'italia' ? t.directory.dir.card.italy : i.aree.map((a) => L.area[a]).join(', ')}</dd>
            </div>
            <div>
              <dt>{d.sede}</dt>
              <dd>{i.sede ? L.regione[i.sede] : d.noSede}</dd>
            </div>
          </dl>
          <h3 className="mi-profile-sub">{d.thesis}</h3>
          <p>{i.tesi}</p>
          <p className="notice">{d.noContacts}</p>
        </article>

        {profile && ev && (
          <article className="card mi-profile-card" aria-labelledby={`${id}-fit`}>
            <div className="card-head">
              <h2 className="card-title" id={`${id}-fit`}>
                {d.fitTitle}
              </h2>
              {ev.eligible && <ScoreMeter score={ev.score} />}
            </div>
            <p className="field-hint">{d.yourProfile(profileSummary(profile, locale))}</p>
            {ev.eligible ? (
              <>
                <h3 className="mi-profile-sub">{d.fitReasons}</h3>
                <ul className="mi-reasons">
                  {ev.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <h3 className="mi-profile-sub">{d.fitWhyNot}</h3>
                <ul className="mi-profile-whynot">
                  {ev.whyNot.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </>
            )}
          </article>
        )}
      </div>

      <aside className="card mi-profile-cta" aria-labelledby={`${id}-cta`}>
        <h2 className="card-title" id={`${id}-cta`}>
          {d.ctaTitle}
        </h2>
        <p className="card-intro">{d.ctaLead}</p>
        {!profile ? (
          <>
            <p>{d.noProfile}</p>
            <div className="mi-profile-actions">
              <Link to={path('matchAgentStartup')} className="btn btn-navy">
                {t.directory.dir.profileAgent}
              </Link>
              <Link to={path('matchStartup')} className="btn btn-outline">
                {t.directory.dir.profileForm}
              </Link>
            </div>
          </>
        ) : active && activeView ? (
          <>
            <p className="mi-profile-status">
              {activeView.status === 'intro' ? d.introReady : justSent ? d.sentNow : d.sent(f.longDate(new Date(active.createdAt)))}
            </p>
            {activeView.status !== 'intro' && <p className="field-hint">{d.pendingNote}</p>}
            <div className="mi-profile-actions">
              <Link to={path('matchRequests')} className="btn btn-navy">
                {d.goRequests}
              </Link>
              <Link to={optInLink} className="btn btn-text">
                {d.simulate}
              </Link>
            </div>
          </>
        ) : ev && !ev.eligible ? (
          <>
            <p>{d.notEligible}</p>
            <ul className="mi-profile-whynot">
              {ev.whyNot.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </>
        ) : used >= MONTHLY_PROPOSAL_LIMIT ? (
          <p className="mi-profile-status">{d.limit(MONTHLY_PROPOSAL_LIMIT)}</p>
        ) : (
          <>
            <button type="button" className="btn btn-gold btn-lg mi-profile-send" onClick={send}>
              {d.ctaButton}
              <span className="sr-only">{d.ctaButtonSr(i.nome)}</span>
            </button>
            <p className="field-hint">
              {t.directory.inbox.counter(used, MONTHLY_PROPOSAL_LIMIT)} · {t.directory.inbox.counterTag}
            </p>
            <Link to={optInLink} className="btn btn-text">
              {d.simulate}
            </Link>
          </>
        )}
        <LiveRegion message={message} />
      </aside>
    </div>
  );
}
