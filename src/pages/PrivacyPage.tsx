import { ExternalLink } from '../components/ExternalLink';
import { PageHero } from '../components/PageHero';
import { LAWYER_URL } from '../site';

export function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Informazioni" title="Privacy">
        <p>In breve: questo sito non raccoglie i tuoi dati.</p>
      </PageHero>
      <section className="section section-cream">
        <div className="container">
          <div className="prose">
          <h2>Nessun cookie, nessun tracciamento</h2>
          <p>
            Questo sito non usa cookie, strumenti di analisi, pixel o altri sistemi di tracciamento, e non
            salva nulla nel tuo browser (niente localStorage).
          </p>
          <h2>I calcoli restano sul tuo dispositivo</h2>
          <p>
            Tutti i calcoli (ripartizione quote, vesting e quiz) avvengono nel tuo browser. Nessun dato che inserisci
            viene inviato a server, a ilTuoAvvocato.com o a terzi. Il sito non effettua richieste esterne: anche i
            caratteri tipografici sono serviti dallo stesso sito.
          </p>
          <p>
            Per rendere i risultati condivisibili, alcuni strumenti riportano i valori inseriti nell’indirizzo della
            pagina (la parte dopo il “?”). Restano lì solo se sei tu a copiare o condividere il link.
          </p>
          <h2>Link esterni</h2>
          <p>
            I pulsanti “Parla con un avvocato” portano a{' '}
            <ExternalLink href={LAWYER_URL}>iltuoavvocato.com</ExternalLink>, che ha una propria informativa privacy.
            Il link contiene solo parametri che indicano da quale strumento arrivi (per esempio
            “utm_campaign=quiz”), non i dati che hai inserito.
          </p>
          <h2>Chi gestisce il sito</h2>
          <p>Startup Legal Toolkit è un servizio di ilTuoAvvocato.com, servizi legali online con avvocati iscritti all’Ordine.</p>
          </div>
        </div>
      </section>
    </>
  );
}
