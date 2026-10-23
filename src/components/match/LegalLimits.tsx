import { Link } from 'react-router-dom';

const LIMITS = [
  { title: 'Solo directory e presentazione', text: 'Mostra profili e fa un’intro quando entrambi dite sì. Non valuta startup né investimenti.' },
  { title: 'Nessuna consulenza sugli investimenti', text: 'Nessuna raccomandazione a investire o a non investire.' },
  { title: 'Non gestiamo denaro', text: 'Nessun pagamento, deposito o strumento finanziario passa da qui.' },
  { title: 'Nessuna raccolta pubblica', text: 'Nessuna pagina pubblica di raccolta né offerta al pubblico: i teaser li vede solo il singolo investitore.' },
  { title: 'Tariffe fisse, nessuna success fee', text: 'Nessuna percentuale sul capitale raccolto. Gli importi non sono ancora definiti.' },
];

export function LegalLimits({ headingId }: { headingId: string }) {
  return (
    <div className="mi-limits">
      <h2 id={headingId} className="mi-limits-title">
        Cosa fa e cosa non fa
      </h2>
      <ul className="mi-limits-list">
        {LIMITS.map((l) => (
          <li key={l.title}>
            <strong>{l.title}.</strong> {l.text}
          </li>
        ))}
      </ul>
      <p className="mi-limits-more">
        Alcuni aspetti regolamentari sono <strong>da verificare con un avvocato</strong>.{' '}
        <Link to="/match-investitori/note-legali/">Leggi le note legali</Link>
      </p>
    </div>
  );
}
