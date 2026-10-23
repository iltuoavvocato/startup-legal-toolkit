import { Link } from 'react-router-dom';
import { PRODUCT_NAME } from '../../lib/optin';

export function PrototypeBanner() {
  return (
    <div className="mi-banner" role="note" aria-label="Prototipo dimostrativo">
      <div className="container mi-banner-inner">
        <span className="mi-banner-tag">Prototipo dimostrativo</span>
        <p>
          {PRODUCT_NAME} <span className="mi-muted">(nome provvisorio)</span> usa dati di esempio e non invia nulla: tutto
          resta nel tuo browser. <Link to="/match-investitori/note-legali/">Limiti e note legali</Link>
        </p>
      </div>
    </div>
  );
}
