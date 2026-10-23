import { Link } from 'react-router-dom';
import { CtaPanel } from '../components/CtaPanel';
import { Disclaimer } from '../components/Disclaimer';
import { PageHero } from '../components/PageHero';
import { LegalLimits } from '../components/match/LegalLimits';
import { PrototypeBanner } from '../components/match/PrototypeBanner';
import { MONTHLY_PROPOSAL_LIMIT } from '../lib/optin';
import '../styles/match.css';

const STEPS = [
  {
    title: 'Dati essenziali e deck',
    text: 'Settore, fase, regione, importo del round e due righe sul progetto. Se vuoi, aggiungi il pitch deck in PDF.',
  },
  {
    title: 'L’agente prepara il profilo, tu confermi',
    text: 'L’agente compila una bozza del profilo. Tu la controlli e la correggi: senza la tua conferma non viene usata.',
  },
  {
    title: 'Match con le motivazioni',
    text: 'L’agente propone gli investitori più in linea, con un punteggio e il perché di ogni abbinamento.',
  },
  {
    title: 'Doppio consenso, poi l’intro',
    text: 'L’investitore vede un teaser anonimo. Solo se dite sì entrambi arriva l’email di presentazione. Un no non viene mai comunicato.',
  },
];

export function MatchLandingPage() {
  return (
    <>
      <PrototypeBanner />
      <PageHero
        eyebrow="Match investitori · prototipo"
        title={
          <>
            Gli investitori giusti, <em>solo se vi scegliete entrambi</em>
          </>
        }
      >
        <p>
          MatchInvStar (nome provvisorio) è un prototipo dimostrativo: un agente prepara il profilo della tua startup,
          propone gli investitori più in linea e vi presenta solo con il consenso di tutte e due le parti.
        </p>
        <div className="mi-hero-actions">
          <Link to="/match-investitori/startup/" className="btn btn-gold btn-lg">
            Sono una startup
            <span aria-hidden="true" className="btn-arrow">
              →
            </span>
          </Link>
          <Link to="/match-investitori/investitore/" className="btn btn-ghost btn-lg">
            Sono un investitore
          </Link>
        </div>
      </PageHero>

      <section className="section section-cream" aria-labelledby="how-title">
        <div className="container">
          <div className="section-head">
            <h2 id="how-title">Come funziona, in quattro passi</h2>
            <p className="section-lead">Un no non viene mai comunicato all’altra parte.</p>
          </div>
          <ol className="mi-how">
            {STEPS.map((s) => (
              <li key={s.title}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section-white" aria-labelledby="doors-title">
        <div className="container">
          <div className="section-head">
            <h2 id="doors-title">Da che parte stai?</h2>
            <p className="section-lead">
              Puoi provare entrambi i percorsi con i dati di esempio: nessuna registrazione, nulla esce dal browser.
            </p>
          </div>
          <div className="mi-doors">
            <article className="card mi-door">
              <h3>Sono una startup</h3>
              <p>Trova gli investitori in linea con il tuo round.</p>
              <ul>
                <li>Settore, fase, regione e importo del round</li>
                <li>Una breve descrizione e, se vuoi, il deck in PDF</li>
                <li>Fino a {MONTHLY_PROPOSAL_LIMIT} proposte al mese (valore provvisorio)</li>
              </ul>
              <Link to="/match-investitori/startup/" className="btn btn-navy">
                Inizia come startup <span aria-hidden="true">→</span>
              </Link>
            </article>
            <article className="card mi-door door-investor">
              <h3>Sono un investitore</h3>
              <p>Ricevi solo startup coerenti con la tua tesi, in forma anonima.</p>
              <ul>
                <li>Settori, fasi e aree geografiche di interesse</li>
                <li>Ticket minimo e massimo</li>
                <li>Il nome della startup arriva solo se dite sì entrambi</li>
              </ul>
              <Link to="/match-investitori/investitore/" className="btn btn-outline">
                Inizia come investitore <span aria-hidden="true">→</span>
              </Link>
            </article>
          </div>
          <p className="center mi-board-note">
            <Link to="/match-investitori/doppio-consenso/">Prova direttamente il simulatore del doppio consenso</Link>
          </p>
        </div>
      </section>

      <section className="section section-cream" aria-labelledby="limits-title">
        <div className="container">
          <LegalLimits headingId="limits-title" />
          <Disclaimer />
          <CtaPanel
            campaign="match"
            title="Stai preparando un round?"
            text="ilTuoAvvocato.com offre servizi legali online per startup, tra cui il SAFE per i primi investitori e i patti tra fondatori."
          />
        </div>
      </section>
    </>
  );
}
