import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CtaPanel } from '../components/CtaPanel';
import { Disclaimer } from '../components/Disclaimer';
import { PageHero } from '../components/PageHero';
import { ConsentExplainer } from '../components/match/ConsentExplainer';
import { DemoBadge } from '../components/match/DemoBadge';
import { MatchBreakdown } from '../components/match/MatchBreakdown';
import { PrototypeBanner } from '../components/match/PrototypeBanner';
import { ScoreMeter } from '../components/match/ScoreMeter';
import { ScoreRulesTable } from '../components/match/ScoreExplainer';
import { SelectField } from '../components/match/SelectField';
import { demoInvestors } from '../data/matchDemo';
import { useI18n } from '../i18n/context';
import { bandList, EXAMPLE_INVESTOR_ID, EXAMPLE_ROUNDS, EXAMPLE_STARTUP_CORE } from '../lib/explain';
import { MONTHLY_PROPOSAL_LIMIT, REQUEST_EXPIRY_DAYS } from '../lib/matchConfig';
import { evaluate, type FilterId } from '../lib/matching';
import { FASI, REGIONI, SETTORI, isFase, isRegione, isSettore, labelsFor, optionsOf, type StartupProfile } from '../lib/matchTaxonomy';

const FILTERS: readonly FilterId[] = ['fase', 'settore', 'area', 'ticket'];

export function MatchHowItWorksPage() {
  const { locale, t, f, path } = useI18n();
  const x = t.explain;
  const L = labelsFor(locale);
  const investor = demoInvestors(locale).find((i) => i.id === EXAMPLE_INVESTOR_ID)!;
  const [core, setCore] = useState(EXAMPLE_STARTUP_CORE);
  const startup: StartupProfile = { id: 'esempio', nome: x.example.startup, oneLiner: '', founder: '', email: '', ...core };
  const evaluation = evaluate(startup, investor, 'startup', locale);
  const aree = investor.aree === 'italia' ? t.directory.dir.card.italy : investor.aree.map((a) => L.area[a]).join(', ');
  const settori = investor.settori === 'tutti' ? t.directory.dir.card.generalist : investor.settori.map((s) => L.settore[s]).join(', ');

  return (
    <>
      <PrototypeBanner />
      <PageHero eyebrow={x.eyebrow} title={x.title}>
        <p>{x.lead}</p>
      </PageHero>
      <section className="section section-cream">
        <div className="container">
          <div className="prose mi-how-works">
            <h2>{x.filtersTitle}</h2>
            <p>{x.filtersLead}</p>
            <ul>
              {FILTERS.map((id) => (
                <li key={id}>{x.filters[id]}</li>
              ))}
            </ul>

            <h2>{x.scoreTitle}</h2>
            <p>{x.scoreLead}</p>
          </div>
          <ScoreRulesTable />

          <div className="prose mi-how-works">
            <h2>{x.shownTitle}</h2>
            <p>{x.shown(bandList(locale))}</p>
            <p>{x.tieBreak}</p>

            <h2>{x.nearTitle}</h2>
            {x.near.map((p) => (
              <p key={p}>{p}</p>
            ))}

            <h2>{x.consentTitle}</h2>
          </div>
          <ConsentExplainer compact />
          <div className="prose mi-how-works">
            <h3>{x.rules.title}</h3>
            <ul>
              <li>{x.rules.cap(MONTHLY_PROPOSAL_LIMIT)}</li>
              <li>{x.rules.expiry(REQUEST_EXPIRY_DAYS)}</li>
              <li>{x.rules.placeholder}</li>
            </ul>

            <h2>{x.notTitle}</h2>
            <ul>
              {x.not.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section section-white" aria-labelledby="why-example-title">
        <div className="container">
          <div className="card mi-why-example">
            <div className="mi-results-head">
              <h2 id="why-example-title">{x.example.title}</h2>
              <DemoBadge />
            </div>
            <p>{x.example.lead}</p>
            <div className="mi-why-grid">
              <div className="mi-why-form">
                <h3>{x.example.startup}</h3>
                <SelectField
                  id="ex-settore"
                  label={x.example.settore}
                  value={core.settore}
                  options={optionsOf(SETTORI, L.settore)}
                  onChange={(v) => isSettore(v) && setCore({ ...core, settore: v })}
                />
                <SelectField
                  id="ex-fase"
                  label={x.example.fase}
                  value={core.fase}
                  options={optionsOf(FASI, L.fase)}
                  onChange={(v) => isFase(v) && setCore({ ...core, fase: v })}
                />
                <SelectField
                  id="ex-regione"
                  label={x.example.regione}
                  value={core.regione}
                  options={optionsOf(REGIONI, L.regione)}
                  onChange={(v) => isRegione(v) && setCore({ ...core, regione: v })}
                />
                <SelectField
                  id="ex-round"
                  label={x.example.round}
                  value={String(core.round)}
                  options={EXAMPLE_ROUNDS.map((r) => ({ value: String(r), label: f.euro(r) }))}
                  onChange={(v) => setCore({ ...core, round: Number(v) })}
                />
                <button type="button" className="btn btn-text btn-sm" onClick={() => setCore(EXAMPLE_STARTUP_CORE)}>
                  {x.example.reset}
                </button>
              </div>
              <div className="mi-why-result" aria-live="polite">
                <div className="mi-match-head">
                  <div className="mi-match-title">
                    <h3>
                      {x.example.investor}: {investor.nome}
                    </h3>
                    <p className="mi-match-meta">
                      {x.example.investorMeta(
                        L.tipo[investor.tipo],
                        settori,
                        investor.fasi.map((s) => L.fase[s]).join(', '),
                        `${f.euro(investor.ticketMin)} – ${f.euro(investor.ticketMax)}`,
                        aree,
                      )}
                    </p>
                  </div>
                  <ScoreMeter score={evaluation.score} />
                </div>
                <MatchBreakdown startup={startup} investor={investor} evaluation={evaluation} />
              </div>
            </div>
            <p className="small-note">{x.fictional}</p>
          </div>
          <p className="center mi-board-note mi-landing-links">
            <Link to={path('matchStartup')}>{t.match.ui.landing.ctaStartup}</Link>
            <Link to={path('matchGuidedDemo')}>{t.guidedDemo.landingLink}</Link>
            <Link to={path('matchLegal')}>{t.match.ui.legal.title}</Link>
          </p>
          <Disclaimer />
          <CtaPanel campaign="match" title={t.match.ui.landing.ctaTitle} text={t.match.ui.landing.ctaText} />
        </div>
      </section>
    </>
  );
}
