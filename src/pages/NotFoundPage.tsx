import { Link } from 'react-router-dom';
import { Disclaimer } from '../components/Disclaimer';
import { useI18n } from '../i18n/context';
import { Rich } from '../i18n/Rich';

/** Rendered for any unknown path: English under /en/…, Italian otherwise (the locale comes from the URL). */
export function NotFoundPage() {
  const { t, path } = useI18n();
  const n = t.common.notFound;
  return (
    <>
      <section className="hero hero-compact">
        <div className="container hero-inner center">
          <p className="eyebrow">{n.eyebrow}</p>
          <h1 tabIndex={-1} id="page-title">
            <Rich text={n.title} />
          </h1>
          <p className="hero-lead">{n.lead}</p>
          <div className="hero-actions hero-actions-center">
            <Link to={path('home')} className="btn btn-gold btn-lg">
              {n.home}
            </Link>
            <Link to={path('quiz')} className="btn btn-ghost btn-lg">
              {n.quiz}
            </Link>
          </div>
        </div>
      </section>
      <section className="section section-cream not-found-note">
        <div className="container">
          <Disclaimer className="center-text" />
        </div>
      </section>
    </>
  );
}
