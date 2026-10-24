// V3 landing: a static, scripted conversation explains the product, the legal limits and shows a real sample match.
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { Rich } from '../../i18n/Rich';
import { variantRouteId } from '../registry';
import { useFounderDemo } from '../shared/useDemo';
import { AgentBubble, InvestorCard, PartsList, ReasonsList, UserBubble } from './parts';

export function Landing() {
  const { t, path } = useI18n();
  const c = t.variants.v3;
  const L = c.landing;
  const ui = t.match.ui;
  const demo = useFounderDemo();
  const sample = demo.matches[0];
  const steps = ui.landing.steps;
  const results = path(variantRouteId('v3', 'results'));
  const investor = path(variantRouteId('v3', 'investor'));

  return (
    <div className="v3-page v3-landing">
      <header className="v3-hero">
        <p className="v3-eyebrow">{L.eyebrow}</p>
        <h1 id="page-title" tabIndex={-1}>
          <Rich text={L.title} />
        </h1>
        <p className="v3-lead">{ui.landing.lead}</p>
        <p className="v3-lead v3-lead-sub">{ui.landing.howLead}</p>
        <div className="v3-ctas">
          <Link className="v3-cta is-primary" to={results}>
            {L.ctaResults}
          </Link>
          <Link className="v3-cta" to={investor}>
            {L.ctaInvestor}
          </Link>
        </div>
      </header>

      <section className="v3-chat v3-preview" aria-label={L.previewLabel}>
        <ol className="v3-log">
          <AgentBubble>
            <p>{L.hello}</p>
          </AgentBubble>
          <UserBubble>{L.askHow}</UserBubble>
          <AgentBubble>
            <p>{L.howIntro}</p>
          </AgentBubble>
          {steps.map((s, i) => (
            <AgentBubble key={s.title} continued>
              <p className="v3-step-num">{L.step(i + 1, steps.length)}</p>
              <h2 className="v3-step-title">{s.title}</h2>
              <p>{s.text}</p>
            </AgentBubble>
          ))}
          <UserBubble>{L.askExample}</UserBubble>
          <AgentBubble wide>
            <p>{L.exampleIntro}</p>
            <p className="v3-quote">{demo.profileLine}</p>
            {sample && (
              <>
                <InvestorCard investor={sample.item} evaluation={sample.evaluation} />
                <ReasonsList reasons={sample.evaluation.reasons} />
                <PartsList evaluation={sample.evaluation} />
              </>
            )}
          </AgentBubble>
          <UserBubble>{L.askLimits}</UserBubble>
          <AgentBubble wide>
            <p>{L.limitsIntro}</p>
            <h2 className="v3-step-title">{ui.limits.title}</h2>
            <ul className="v3-limits">
              {ui.limits.items.map((it) => (
                <li key={it.title}>
                  <strong>{it.title}.</strong> {it.text}
                </li>
              ))}
            </ul>
            <p className="v3-small">{L.limitsOutro}</p>
          </AgentBubble>
          <AgentBubble continued>
            <p>{L.askStart}</p>
          </AgentBubble>
        </ol>
        <nav className="v3-chips v3-chips-static" aria-label={L.pathsLabel}>
          <Link className="v3-chip is-primary" to={results}>
            {ui.landing.ctaStartup}
          </Link>
          <Link className="v3-chip is-primary" to={investor}>
            {ui.landing.ctaInvestor}
          </Link>
        </nav>
      </section>
    </div>
  );
}
