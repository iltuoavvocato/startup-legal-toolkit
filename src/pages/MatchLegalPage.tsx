import { Link } from 'react-router-dom';
import { CtaPanel } from '../components/CtaPanel';
import { Disclaimer } from '../components/Disclaimer';
import { PageHero } from '../components/PageHero';
import { PrototypeBanner } from '../components/match/PrototypeBanner';

export function MatchLegalPage() {
  return (
    <>
      <PrototypeBanner />
      <PageHero eyebrow="Match investitori · note legali" title="Limiti e note legali">
        <p>Cosa fa questo prototipo, cosa non fa e cosa va verificato prima di una versione reale.</p>
      </PageHero>
      <section className="section section-cream">
        <div className="container">
          <div className="prose mi-legal">
            <h2>Cosa fa</h2>
            <p>
              MatchInvStar (nome provvisorio) è pensato come un servizio di <strong>directory e presentazione</strong>:
              mostra profili di startup e investitori e, quando entrambe le parti dicono sì, li presenta con un’email.
              Non esprime giudizi sul merito di una startup o di un investimento.
            </p>

            <h2>Cosa non fa</h2>
            <ul>
              <li>
                <strong>Nessuna consulenza in materia di investimenti.</strong> Il punteggio di affinità misura solo la
                coerenza tra il profilo della startup e la tesi dichiarata dall’investitore: non è una raccomandazione a
                investire o a non investire.
              </li>
              <li>
                <strong>Non gestisce denaro.</strong> Non riceve, custodisce o trasferisce somme o strumenti finanziari.
                Gli eventuali accordi di investimento si fanno direttamente tra le parti, fuori dalla piattaforma.
              </li>
              <li>
                <strong>Nessuna raccolta pubblica.</strong> Non esistono pagine pubbliche di raccolta né offerte al
                pubblico: il teaser anonimo lo vede solo il singolo investitore a cui viene proposto.
              </li>
              <li>
                <strong>Tariffe fisse, nessuna success fee.</strong> Il modello previsto non prevede percentuali sul
                capitale raccolto. Gli importi non sono ancora definiti.
              </li>
            </ul>

            <h2>L’agente e la supervisione umana</h2>
            <p>
              Chi usa il servizio deve sapere che profili e match sono proposti da un sistema automatico. L’agente propone,
              le persone decidono: il founder conferma sempre il profilo, e l’intro parte solo con il sì di entrambe le
              parti. In questo prototipo l’agente è una simulazione deterministica: non usa intelligenza artificiale e non
              legge il contenuto del deck.
            </p>

            <h2>Dati personali</h2>
            <p>
              Una versione reale tratterebbe dati personali di founder e investitori (nomi, contatti, informazioni sui
              progetti e sulle preferenze di investimento). Servirebbero una base giuridica per ogni trattamento,
              un’informativa chiara, la minimizzazione dei dati (per esempio teaser senza nomi), tempi di conservazione
              definiti e, se necessario, una valutazione d’impatto. In questo prototipo nessun dato lascia il browser: il
              PDF non viene letto né caricato e niente viene salvato.
            </p>

            <div className="notice">
              <strong>Da verificare con un avvocato</strong> prima di qualsiasi versione reale:
              <ul>
                <li>
                  <strong>Regolamento (UE) 2020/1503</strong> sui fornitori europei di servizi di crowdfunding per le
                  imprese: se e quando un servizio di abbinamento tra startup e investitori vi rientra.
                </li>
                <li>
                  <strong>Consob</strong>: regole e vigilanza applicabili all’attività svolta.
                </li>
                <li>
                  <strong>TUF, art. 18</strong>: i servizi e le attività di investimento sono riservati a soggetti
                  autorizzati. Va verificato che l’attività di presentazione non vi ricada.
                </li>
                <li>
                  <strong>GDPR</strong>: basi giuridiche, informative, minimizzazione, conservazione e diritti degli
                  interessati.
                </li>
                <li>
                  <strong>AI Act</strong>: obblighi di trasparenza sull’uso di un agente automatico e supervisione umana.
                </li>
              </ul>
            </div>

            <div className="mi-callout">
              <h2>Una versione reale richiede altro lavoro</h2>
              <p>
                Un vero doppio consenso con dati reali di investitori richiede un backend (account, identificazione degli
                investitori, invio delle proposte e delle email) e una verifica privacy e regolamentare. Niente di tutto
                questo è incluso nel prototipo, che usa solo dati di esempio e funziona interamente nel browser.
              </p>
            </div>

            <p>
              <Link to="/match-investitori/">Torna alla panoramica</Link> ·{' '}
              <Link to="/match-investitori/doppio-consenso/">Prova il simulatore del doppio consenso</Link>
            </p>
          </div>
          <Disclaimer />
          <CtaPanel
            campaign="match"
            title="Hai domande su un round?"
            text="ilTuoAvvocato.com offre servizi legali online per startup, con avvocati iscritti all’Ordine."
          />
        </div>
      </section>
    </>
  );
}
