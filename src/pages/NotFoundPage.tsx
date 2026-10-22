import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="hero hero-compact">
      <div className="container hero-inner center">
        <p className="eyebrow">Errore 404</p>
        <h1 tabIndex={-1} id="page-title">
          Pagina <em>non trovata</em>
        </h1>
        <p className="hero-lead">La pagina che cerchi non esiste o è stata spostata.</p>
        <div className="hero-actions hero-actions-center">
          <Link to="/" className="btn btn-gold btn-lg">
            Torna alla home
          </Link>
          <Link to="/quiz/" className="btn btn-ghost btn-lg">
            Fai il quiz
          </Link>
        </div>
      </div>
    </section>
  );
}
