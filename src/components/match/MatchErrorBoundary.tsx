import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { pathFor } from '../../i18n/routes';
import { clearMatchStorage } from '../../lib/matchStorage';
import { Disclaimer } from '../Disclaimer';
import { PageHero } from '../PageHero';

function Fallback() {
  const { t, locale } = useI18n();
  const b = t.hardening.boundary;
  const restart = () => {
    clearMatchStorage();
    window.location.reload();
  };
  return (
    <>
      <PageHero eyebrow="MatchInvStar" title={b.title}>
        <p>{b.text}</p>
      </PageHero>
      <section className="section section-cream tool-section">
        <div className="container">
          <div className="card mi-boundary" role="alert">
            <p className="actions">
              <button type="button" className="btn btn-gold" onClick={restart}>
                {b.restart}
              </button>
              <Link className="btn btn-outline" to={pathFor('match', locale)} reloadDocument>
                {b.home}
              </Link>
            </p>
          </div>
          <Disclaimer />
        </div>
      </section>
    </>
  );
}

interface State {
  failed: boolean;
}

/**
 * Catches render errors on the matching pages (for example a stored state the checks let through but a component
 * can't draw) and shows a bilingual fallback instead of a blank page. "Ricomincia" clears only the demo's keys.
 */
export class MatchErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo) {
    console.warn('MatchInvStar page error', error, info.componentStack);
  }

  override render() {
    return this.state.failed ? <Fallback /> : this.props.children;
  }
}
