// Milestone 10: error fallback for the matching pages, the deck-reader support note and the privacy section on the
// matching demo's local storage.
const it = {
  boundary: {
    title: 'Qualcosa non ha funzionato',
    text: 'Questa pagina del prototipo non è riuscita a caricarsi, forse per dati salvati in questa scheda che non sono più validi. Puoi ricominciare: cancelliamo solo i dati della demo MatchInvStar salvati in questo browser (profilo, conversazione, richieste). La preferenza di lingua resta.',
    restart: 'Ricomincia',
    home: 'Torna alla pagina del prototipo',
  },
  deckUnsupported:
    'Questo browser non supporta la lettura dei PDF nel dispositivo (serve una versione recente di Chrome, Edge, Firefox o Safari 17.4+). Puoi continuare compilando i campi a mano: il resto della demo funziona allo stesso modo.',
  privacy: {
    title: 'Demo MatchInvStar: dati solo su questo dispositivo',
    text: 'Il prototipo di match con investitori salva profilo, conversazione con l’agente, richieste ed esportazioni solo nel sessionStorage di questa scheda del browser (chiavi che iniziano con “matchinvstar-”); l’unico dato nel localStorage resta la lingua. Niente viene inviato a server, a ilTuoAvvocato.com o a terzi, e il PDF del deck viene letto nel browser senza essere salvato né inviato.',
    howTo: 'I dati della demo si cancellano chiudendo la scheda, con “Ricomincia” / “Azzera la demo” nelle pagine del prototipo, oppure con il pulsante qui sotto.',
    clear: 'Cancella i dati della demo',
    cleared: 'Dati della demo cancellati da questo browser.',
    failed: 'Lo storage del browser non è disponibile: non c’è nulla da cancellare.',
  },
};

export type HardeningMessages = typeof it;

const en: HardeningMessages = {
  boundary: {
    title: 'Something went wrong',
    text: 'This prototype page couldn’t load, perhaps because data saved in this tab is no longer valid. You can start over: we only delete the MatchInvStar demo data saved in this browser (profile, conversation, requests). Your language preference stays.',
    restart: 'Start over',
    home: 'Back to the prototype page',
  },
  deckUnsupported:
    'This browser can’t read PDFs on the device (it needs a recent Chrome, Edge, Firefox or Safari 17.4+). You can carry on and fill in the fields by hand: the rest of the demo works the same way.',
  privacy: {
    title: 'MatchInvStar demo: data on this device only',
    text: 'The investor matching prototype saves your profile, the conversation with the agent, requests and exports only in this browser tab’s sessionStorage (keys starting with “matchinvstar-”); the only thing in localStorage is still the language. Nothing is sent to a server, to ilTuoAvvocato.com or to third parties, and the deck PDF is read in the browser without being saved or sent.',
    howTo: 'The demo data is deleted when you close the tab, with “Start over” / “Reset the demo” on the prototype pages, or with the button below.',
    clear: 'Delete the demo data',
    cleared: 'Demo data deleted from this browser.',
    failed: 'Browser storage isn’t available: there is nothing to delete.',
  },
};

export default { it, en };
