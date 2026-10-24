import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CtaPanel } from '../components/CtaPanel';
import { Disclaimer } from '../components/Disclaimer';
import { PageHero } from '../components/PageHero';
import { DemoBadge } from '../components/match/DemoBadge';
import { FictionalNotice } from '../components/match/FictionalNotice';
import { IntroEmailPreview } from '../components/match/IntroEmailPreview';
import { LiveRegion } from '../components/match/LiveRegion';
import { PrototypeBanner } from '../components/match/PrototypeBanner';
import { ScoreMeter } from '../components/match/ScoreMeter';
import { TeaserCard } from '../components/match/TeaserCard';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { readQuery, useSyncQuery } from '../hooks/useQueryState';
import { useI18n } from '../i18n/context';
import {
  AUTOPLAY_MS,
  BRANCH_STEPS,
  demoCast,
  frameAt,
  nextPosition,
  parsePosition,
  positionToQuery,
  prevPosition,
  SHARED_STEPS,
  STEP_COUNT,
  withBranch,
  type DemoBranch,
  type DemoCast,
  type DemoFrame,
  type DemoPosition,
  type DemoSide,
} from '../lib/guidedDemo';
import type { RequestView } from '../lib/inbox';
import { labelsFor } from '../lib/matchTaxonomy';
import { introEmail, teaserOf } from '../lib/optin';

const BRANCHES: DemoBranch[] = ['yes', 'no'];
const SIDES: DemoSide[] = ['founder', 'investor'];

/** Arrow keys change step, except while typing or on controls that use arrows themselves (radios). */
function arrowTarget(e: KeyboardEvent): boolean {
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return false;
  const el = e.target as HTMLElement | null;
  if (!el) return true;
  if (el.isContentEditable || el.closest('input, textarea, select, [role="radiogroup"], dialog[open]')) return false;
  return true;
}

export function MatchGuidedDemoPage() {
  const { locale, t } = useI18n();
  const g = t.guidedDemo;
  const id = useId();
  const cast = useMemo(() => demoCast(locale), [locale]);
  const [pos, setPos] = useState<DemoPosition>(() => parsePosition(readQuery()));
  const frame = useMemo(() => frameAt(pos, cast), [pos, cast]);
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [playing, setPlaying] = useState(false);
  const [side, setSide] = useState<DemoSide>(frame.focus);
  const [message, setMessage] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  useSyncQuery(positionToQuery(pos));

  const go = useCallback(
    (next: DemoPosition | null, opts: { focus?: boolean } = {}) => {
      if (!next) return;
      setPos(next);
      const f = frameAt(next, cast);
      setSide(f.focus);
      const s = g.steps[f.id];
      setMessage(`${g.stepOf(f.step, STEP_COUNT)}. ${s.title}. ${s.caption}`);
      // In-screen actions disappear with the step: keep keyboard users on the new step's heading.
      if (opts.focus) requestAnimationFrame(() => headingRef.current?.focus());
    },
    [cast, g],
  );

  // Autoplay: one step every few seconds, stopping at the end (never with reduced motion).
  const canPlay = !reduced;
  const atEnd = pos.step === STEP_COUNT;
  useEffect(() => {
    if (!playing || !canPlay) return;
    if (atEnd) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => go(nextPosition(pos)), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [playing, canPlay, atEnd, pos, go]);

  // Keyboard: ← → anywhere on the page (not while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || !arrowTarget(e)) return;
      e.preventDefault();
      setPlaying(false);
      go(e.key === 'ArrowRight' ? nextPosition(pos) : prevPosition(pos));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pos, go]);

  const manual = (next: DemoPosition | null, focus = false) => {
    setPlaying(false);
    go(next, { focus });
  };
  const step = g.steps[frame.id];
  const order = [...SHARED_STEPS, ...BRANCH_STEPS[pos.branch]];

  return (
    <>
      <PrototypeBanner />
      <PageHero eyebrow={g.eyebrow} title={g.title}>
        <p>{g.lead}</p>
      </PageHero>
      <section className="section-cream tool-section">
        <div className="container">
          <FictionalNotice />
          <p className="notice mi-gd-note">{g.fictional}</p>

          <div className="card mi-gd-player">
            <nav className="mi-gd-timeline" aria-label={g.timelineLabel}>
              <ol>
                {order.map((sid, k) => {
                  const n = k + 1;
                  const current = n === pos.step;
                  return (
                    <li key={sid} className={`${current ? 'is-current' : ''}${n < pos.step ? ' is-done' : ''}${n > SHARED_STEPS.length ? ' is-branch' : ''}`}>
                      <button
                        type="button"
                        aria-current={current ? 'step' : undefined}
                        onClick={() => manual({ ...pos, step: n })}
                      >
                        <span className="mi-gd-num" aria-hidden="true">
                          {n > SHARED_STEPS.length ? `${n}${pos.branch === 'yes' ? 'a' : 'b'}` : n}
                        </span>
                        <span className="mi-gd-step-title">{g.steps[sid].title}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              <fieldset className="mi-gd-branch">
                <legend>{g.branchLabel}</legend>
                <div className="segmented" role="radiogroup" aria-label={g.branchLabel}>
                  {BRANCHES.map((b) => (
                    <label key={b} className={pos.branch === b ? 'is-checked' : undefined}>
                      <input
                        type="radio"
                        name={`${id}-branch`}
                        value={b}
                        checked={pos.branch === b}
                        aria-label={g.branch[b]}
                        onChange={() => manual(withBranch(pos, b))}
                      />
                      <span className="mi-gd-branch-long">{g.branch[b]}</span>
                      <span className="mi-gd-branch-short">{g.branchShort[b]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </nav>

            <div className="mi-gd-caption">
              <p className="mi-gd-count">
                {g.stepOf(pos.step, STEP_COUNT)} · {g.day(frame.day)}
                {pos.step > SHARED_STEPS.length && <> · {g.branchShort[pos.branch]}</>}
              </p>
              <h2 id={`${id}-step`} ref={headingRef} tabIndex={-1}>
                {step.title}
              </h2>
              <p>{step.caption}</p>
            </div>

            <div className="mi-gd-controls">
              <button type="button" className="btn btn-outline" onClick={() => manual(prevPosition(pos))} disabled={pos.step === 1}>
                <span aria-hidden="true">←</span> {g.prev}
              </button>
              {canPlay &&
                (playing ? (
                  <button type="button" className="btn btn-outline" onClick={() => setPlaying(false)} aria-pressed="true">
                    {g.pause}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-outline"
                    aria-pressed="false"
                    onClick={() => {
                      if (atEnd) go({ ...pos, step: 1 });
                      setPlaying(true);
                    }}
                  >
                    {atEnd ? g.restart : g.play}
                  </button>
                ))}
              <button type="button" className="btn btn-navy" onClick={() => manual(nextPosition(pos))} disabled={atEnd}>
                {g.next} <span aria-hidden="true">→</span>
              </button>
            </div>
            <p className="field-hint mi-gd-hint">{reduced ? g.reducedMotion : g.keysHint}</p>
          </div>

          <div className="mi-gd-sides segmented" role="radiogroup" aria-label={g.sideLabel}>
            {SIDES.map((s) => (
              <label key={s} className={side === s ? 'is-checked' : undefined}>
                <input type="radio" name={`${id}-side`} value={s} checked={side === s} onChange={() => setSide(s)} />
                {g.sides[s]}
              </label>
            ))}
          </div>

          <div className="mi-gd-split" aria-labelledby={`${id}-step`}>
            <Screen side="founder" active={side === 'founder'} highlight={frame.focus === 'founder'}>
              <FounderScreen frame={frame} cast={cast} onAccept={() => manual(nextPosition(pos), true)} />
            </Screen>
            <Screen side="investor" active={side === 'investor'} highlight={frame.focus === 'investor'}>
              <InvestorScreen
                frame={frame}
                cast={cast}
                onAnswer={(b) => manual({ step: SHARED_STEPS.length + 1, branch: b }, true)}
              />
            </Screen>
          </div>

          {frame.silentFounderView && frame.founderView && <NoReveal view={frame.founderView} silent={frame.silentFounderView} cast={cast} />}

          <LiveRegion message={message} />

          <nav className="mi-gd-links" aria-labelledby={`${id}-links`}>
            <h2 id={`${id}-links`} className="card-title">
              {g.links.title}
            </h2>
            <p className="mi-landing-links">
              <RealLinks />
            </p>
          </nav>

          <Disclaimer />
          <CtaPanel campaign="match" title={t.match.ui.landing.ctaTitle} text={t.match.ui.landing.ctaText} />
        </div>
      </section>
    </>
  );
}

function RealLinks() {
  const { t, path } = useI18n();
  const g = t.guidedDemo;
  return (
    <>
      <Link to={path('matchAgentStartup')}>{g.links.agent}</Link>
      <Link to={path('matchRequests')}>{g.links.requests}</Link>
      <Link to={path('matchOptIn')}>{g.links.simulator}</Link>
    </>
  );
}

function Screen({ side, active, highlight, children }: { side: DemoSide; active: boolean; highlight: boolean; children: ReactNode }) {
  const { t } = useI18n();
  const g = t.guidedDemo;
  const hid = useId();
  return (
    <section
      className={`mi-gd-screen side-${side}${active ? ' is-active' : ''}${highlight ? ' is-focus' : ''}`}
      aria-labelledby={hid}
      data-side={side}
    >
      <header className="mi-gd-screen-head">
        <h3 id={hid}>{g.screenTitle[side]}</h3>
        <DemoBadge />
      </header>
      <div className="mi-gd-screen-body">{children}</div>
    </section>
  );
}

/** Status line of a request, with the inbox's own copy and due date. */
function Due({ view }: { view: RequestView }) {
  const { t, f } = useI18n();
  const x = t.directory.inbox;
  if (view.group === 'pending' && view.daysLeft !== null)
    return <span className={`mi-inbox-due${view.daysLeft <= 3 ? ' is-soon' : ''}`}>{x.expiresIn(view.daysLeft)}</span>;
  if (view.status === 'expired' && view.deadline !== null)
    return <span className="mi-inbox-due is-closed">{x.expiredOn(f.longDate(new Date(view.deadline)))}</span>;
  return null;
}

function founderCopy(view: RequestView, c: ReturnType<typeof useI18n>['t']['directory']['inbox']['founder']): [string, string] {
  switch (view.status) {
    case 'waiting':
      return [c.waitingTitle, c.waitingText];
    case 'your-turn':
      return [c.yourTurnTitle, c.yourTurnText];
    case 'intro':
      return [c.introTitle, c.introText];
    case 'expired':
      return [c.expiredTitle, c.expiredText];
    case 'declined-by-you':
      return [c.declinedTitle, c.declinedText];
  }
}

function FounderRequest({ view, cast }: { view: RequestView; cast: DemoCast }) {
  const { locale, t } = useI18n();
  const x = t.directory.inbox;
  const [title, text] = founderCopy(view, x.founder);
  return (
    <article className={`mi-request status-${view.status}`}>
      <header className="mi-request-head">
        <div>
          <h4>{cast.investor.nome}</h4>
          <p className="mi-request-meta">{labelsFor(locale).tipo[cast.investor.tipo]}</p>
        </div>
        <Due view={view} />
      </header>
      <p className="mi-request-status">
        <strong>{title}</strong> {text}
      </p>
    </article>
  );
}

function FounderScreen({ frame, cast, onAccept }: { frame: DemoFrame; cast: DemoCast; onAccept: () => void }) {
  const { locale, t, f } = useI18n();
  const g = t.guidedDemo;
  const L = labelsFor(locale);
  const x = t.directory.inbox.founder;
  const v = frame.founderView;

  if (frame.id === 'profile') {
    const s = cast.startup;
    return (
      <div className="mi-gd-panel">
        <p className="mi-gd-kicker">{g.founder.fromDeck(s.nome)}</p>
        <h4>{g.founder.profileTitle}</h4>
        <p className="mi-gd-oneliner">{s.oneLiner}</p>
        <dl className="mi-facts">
          <div>
            <dt>{t.match.ui.teaser.settore}</dt>
            <dd>{L.settore[s.settore]}</dd>
          </div>
          <div>
            <dt>{t.match.ui.teaser.fase}</dt>
            <dd>{L.fase[s.fase]}</dd>
          </div>
          <div>
            <dt>{t.match.ui.teaser.regione}</dt>
            <dd>{L.regione[s.regione]}</dd>
          </div>
          <div>
            <dt>{t.match.ui.teaser.round}</dt>
            <dd>{f.euro(s.round)}</dd>
          </div>
        </dl>
        <p className="mi-gd-ok">✓ {g.founder.confirmed}</p>
      </div>
    );
  }
  if (frame.id === 'matches') {
    const top = cast.matches.slice(0, 3);
    return (
      <div className="mi-gd-panel">
        <h4>{g.founder.matchesTitle(cast.matches.length)}</h4>
        <ol className="mi-gd-matches">
          {top.map((m) => (
            <li key={m.item.id}>
              <div>
                <strong>{m.item.nome}</strong>
                <span className="mi-request-meta">{L.tipo[m.item.tipo]}</span>
              </div>
              <ScoreMeter score={m.evaluation.score} />
            </li>
          ))}
        </ol>
        <p className="field-hint">{g.founder.nothingYet}</p>
      </div>
    );
  }
  if (!v) return null;
  return (
    <div className="mi-gd-panel">
      <p className="mi-gd-kicker">{g.founder.proposedTo}</p>
      <FounderRequest view={v} cast={cast} />
      {v.status === 'your-turn' && (
        <div className="mi-request-actions">
          <button type="button" className="btn btn-gold btn-sm" onClick={onAccept}>
            {x.accept}
            <span className="sr-only">: {cast.investor.nome}</span>
          </button>
        </div>
      )}
      {v.status === 'intro' && (
        <details className="details mi-gd-email" open>
          <summary>{x.showEmail}</summary>
          <IntroEmailPreview email={introEmail(cast.startup, cast.investor, locale)} />
        </details>
      )}
    </div>
  );
}

function InvestorScreen({ frame, cast, onAnswer }: { frame: DemoFrame; cast: DemoCast; onAnswer: (b: DemoBranch) => void }) {
  const { locale, t } = useI18n();
  const g = t.guidedDemo;
  const c = t.directory.inbox.investor;
  const v = frame.investorView;

  if (!v) {
    const incoming = frame.id === 'propose';
    return (
      <div className="mi-gd-panel mi-gd-empty">
        <h4>{incoming ? g.investor.incoming : g.investor.emptyTitle}</h4>
        <p>{incoming ? g.investor.incomingText : g.investor.emptyText}</p>
      </div>
    );
  }
  const copy: Record<RequestView['status'], [string, string]> = {
    waiting: [c.waitingTitle, c.waitingText],
    'your-turn': [c.yourTurnTitle, c.yourTurnText],
    intro: [c.introTitle(cast.startup.nome), c.introText],
    expired: [c.expiredTitle, c.expiredText],
    'declined-by-you': [c.declinedTitle, c.declinedText],
  };
  const [title, text] = copy[v.status];
  const chose = frame.id === 'teaser' ? null : frame.branch;
  return (
    <div className="mi-gd-panel">
      <p className="mi-gd-kicker">{g.screenWho(cast.investor.nome)}</p>
      <article className={`mi-request status-${v.status}`}>
        <header className="mi-request-head">
          <div>
            <h4>{title}</h4>
          </div>
          <Due view={v} />
        </header>
        {/* The startup stays anonymous until both say yes. */}
        {v.knowsName ? (
          <p className="mi-request-line">
            <strong>{cast.startup.nome}</strong> · {cast.startup.oneLiner}
          </p>
        ) : (
          <TeaserCard teaser={teaserOf(cast.startup, locale)} />
        )}
        <p className="mi-request-status">{text}</p>
        {v.status === 'your-turn' && (
          <div className="mi-request-actions">
            <button type="button" className="btn btn-gold btn-sm" onClick={() => onAnswer('yes')}>
              {c.yes}
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => onAnswer('no')}>
              {c.no}
            </button>
          </div>
        )}
        {chose && <p className="mi-gd-chose">{g.investor.chose[chose]}</p>}
      </article>
      {v.status === 'intro' && (
        <details className="details mi-gd-email">
          <summary>{t.directory.inbox.founder.showEmail}</summary>
          <IntroEmailPreview email={introEmail(cast.startup, cast.investor, locale)} />
        </details>
      )}
    </div>
  );
}

/** "No" branch: the founder's screen next to the same request with no answer at all. They are equal by construction. */
function NoReveal({ view, silent, cast }: { view: RequestView; silent: RequestView; cast: DemoCast }) {
  const { t } = useI18n();
  const g = t.guidedDemo;
  const same = JSON.stringify(view) === JSON.stringify(silent);
  return (
    <aside className="mi-gd-noreveal" aria-labelledby="mi-gd-noreveal-title">
      <h2 id="mi-gd-noreveal-title">{g.noRevealTitle}</h2>
      <p>{g.noRevealText}</p>
      <div className="mi-gd-compare">
        <div>
          <p className="mi-gd-kicker">{g.screenTitle.founder}</p>
          <FounderRequest view={view} cast={cast} />
        </div>
        <div>
          <p className="mi-gd-kicker">{g.silentLabel}</p>
          <FounderRequest view={silent} cast={cast} />
        </div>
      </div>
      {same && <p className="mi-gd-identical">= {g.identical}</p>}
    </aside>
  );
}
