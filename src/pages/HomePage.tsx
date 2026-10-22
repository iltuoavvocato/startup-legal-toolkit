import { Link } from 'react-router-dom';
import { ChecklistIcon, PieIcon, TimelineIcon } from '../components/Icons';
import { LawyerCta } from '../components/LawyerCta';

const TOOLS = [
  {
    to: '/equity/',
    title: 'Ripartizione quote',
    text: 'Dividi le quote tra 2–5 cofondatori in base a idea, tempo, capitale, competenze e ruolo.',
    Icon: PieIcon,
  },
  {
    to: '/vesting/',
    title: 'Simulatore vesting',
    text: 'Vedi come maturano le quote nel tempo e cosa succede se un founder esce al mese X.',
    Icon: TimelineIcon,
  },
  {
    to: '/quiz/',
    title: 'Quali documenti mi servono?',
    text: 'Sette domande per una checklist personalizzata dei documenti legali della tua startup.',
    Icon: ChecklistIcon,
  },
];

const REASONS = [
  {
    title: 'Le quote decise a voce non reggono',
    text: 'All’inizio siete d’accordo su tutto. Poi cambiano l’impegno, i soldi messi, le aspettative. Un accordo scritto oggi evita discussioni domani, quando sarà più difficile trovarsi d’accordo.',
  },
  {
    title: 'Qualcuno potrebbe uscire presto',
    text: 'Se un socio lascia dopo pochi mesi e tiene tutte le sue quote, chi resta lavora anche per lui. Il vesting e le clausole di good/bad leaver servono proprio a questo.',
  },
  {
    title: 'Il codice scritto prima della società',
    text: 'Codice, marchio e design creati prima della costituzione, o da un freelance, in genere non appartengono automaticamente alla società. Gli investitori lo verificheranno.',
  },
];

const DOCS = [
  {
    title: 'Patti tra fondatori',
    text: 'L’accordo tra soci su quote, ruoli, decisioni e uscita. Spesso prende la forma di un patto parasociale.',
  },
  {
    title: 'SAFE',
    text: 'Per raccogliere i primi investimenti rinviando la valutazione al round successivo. In Italia va adattato alla s.r.l.',
  },
  {
    title: 'Work for equity',
    text: 'Per chi collabora ricevendo quote al posto (o in aggiunta) di un compenso: quante, quando, a quali condizioni.',
  },
  {
    title: 'Vesting',
    text: 'Le quote si maturano nel tempo, con un eventuale cliff iniziale e regole diverse per good e bad leaver.',
  },
  {
    title: 'Cessione IP',
    text: 'Trasferisce alla società i diritti su codice, marchio, design e contenuti, e ne tutela il valore.',
  },
];

export function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <p className="eyebrow">Startup Legal Toolkit · gratuito</p>
          <h1 tabIndex={-1} id="page-title">
            Gli strumenti legali per chi <em>fonda una startup</em>
          </h1>
          <p className="hero-lead">
            Tre strumenti gratuiti per dividere le quote tra soci, simulare il vesting e capire quali documenti ti
            servono. Per arrivare dall’avvocato con le idee già chiare.
          </p>
          <div className="hero-actions">
            <Link to="/quiz/" className="btn btn-gold btn-lg">
              Scopri quali documenti ti servono
              <span aria-hidden="true" className="btn-arrow">
                →
              </span>
            </Link>
            <Link to="/equity/" className="btn btn-ghost btn-lg">
              Calcola la ripartizione quote
            </Link>
          </div>
          <p className="hero-note">Nessuna registrazione. Nessun dato salvato: tutto resta nel tuo browser.</p>
        </div>
      </section>

      <section className="section section-cream" aria-labelledby="tools-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow-dark">Gli strumenti</p>
            <h2 id="tools-title">Tre strumenti, cinque minuti</h2>
          </div>
          <ul className="tool-grid">
            {TOOLS.map(({ to, title, text, Icon }) => (
              <li key={to}>
                <Link to={to} className="tool-card">
                  <span className="tool-icon">
                    <Icon />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <span className="tool-link">
                    Apri lo strumento <span aria-hidden="true">→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section-white" aria-labelledby="why-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow-dark">Perché pensarci subito</p>
            <h2 id="why-title">
              I problemi tra soci nascono <em>all’inizio</em>
            </h2>
          </div>
          <ol className="reasons">
            {REASONS.map((r, i) => (
              <li key={r.title}>
                <span className="reason-num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3>{r.title}</h3>
                <p>{r.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section-navy" aria-labelledby="docs-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">I documenti</p>
            <h2 id="docs-title">Cinque documenti da conoscere</h2>
            <p className="section-lead">
              Non servono tutti a tutti. Il quiz ti aiuta a capire da quali partire.
            </p>
          </div>
          <ul className="doc-grid">
            {DOCS.map((d) => (
              <li key={d.title} className="doc-card">
                <h3>{d.title}</h3>
                <p>{d.text}</p>
              </li>
            ))}
          </ul>
          <div className="center">
            <Link to="/quiz/" className="btn btn-outline-light">
              Fai il quiz <span aria-hidden="true" className="btn-arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="cta-band" aria-labelledby="cta-title">
        <div className="container cta-band-inner">
          <div>
            <h2 id="cta-title">
              Hai bisogno di una mano? <em>Parla con un avvocato</em> di ilTuoAvvocato.com
            </h2>
            <p>
              Servizi legali online con avvocati iscritti all’Ordine: SAFE, patti tra fondatori, work for equity, vesting
              e tutela della proprietà intellettuale.
            </p>
          </div>
          <LawyerCta campaign="home" className="btn-lg" />
        </div>
      </section>
    </>
  );
}
