// Design variants gallery (internal prototype pages, noindex): shared copy. Per-variant copy in ./variantCopy/.
import v1 from './variantCopy/v1';
import v2 from './variantCopy/v2';
import v3 from './variantCopy/v3';
import v4 from './variantCopy/v4';
import v5 from './variantCopy/v5';

interface VariantInfo {
  name: string;
  tagline: string;
  description: string;
  pros: string[];
  cons: string[];
}

const it = {
  banner: {
    aria: 'Variante di design',
    tag: 'Variante di design – prototipo',
    text: 'Direzione grafica alternativa, da confrontare con le altre. Non è il prodotto definitivo.',
    gallery: 'Tutte le varianti',
  },
  fictional: 'Dati di esempio fittizi: startup, investitori, persone e importi sono inventati.',
  loading: 'Caricamento della variante…',
  screens: {
    landing: 'Landing',
    results: 'Risultati founder',
    investor: 'Vista investitore',
    agent: 'Chat con l’agente',
    directory: 'Directory investitori',
    requests: 'Richieste',
    export: 'One-pager teaser',
  },
  screenNav: 'Schermate di questa variante',
  variantNav: 'Stessa schermata in un’altra variante',
  // Shared action and status copy used by every variant.
  actions: {
    pass: 'Passa',
    interested: 'Interessato',
    undo: 'Annulla l’ultima scelta',
    propose: 'Proponi il profilo',
    proposed: 'Profilo proposto',
    simulateReply: 'Simula la risposta della startup',
    restart: 'Ricomincia',
    why: 'Perché?',
  },
  buckets: { nuovo: 'Da valutare', passato: 'Passate', inviato: 'Interesse inviato', intro: 'Intro pronta' },
  replyNote:
    'Simulazione: alcune startup di esempio accettano, altre no. Se una startup non accetta continui a vedere “Interesse inviato”: un no non viene mai comunicato.',
  passNote: 'La startup non saprà che hai passato.',
  introReveal: (nome: string, founder: string) => `${nome} · fondata da ${founder}`,
  founderProfile: (settore: string, fase: string, regione: string, round: string) =>
    `Profilo di esempio: startup ${settore}, ${fase}, ${regione}, round da ${round}`,
  investorThesis: (settori: string, fasi: string, ticket: string) => `Tesi di esempio: ${settori} · ${fasi} · ticket ${ticket}`,
  // Shared copy of the two mock screens (guided agent chat, investor directory): visual explorations, not new flows.
  agentMock: {
    agent: 'Agente',
    you: 'Tu',
    greeting: 'Ciao, sono l’agente di MatchInvStar. Ti faccio quattro domande sulla startup e ti propongo gli investitori in linea.',
    questions: {
      settore: 'In che settore lavora la startup?',
      fase: 'In che fase siete?',
      round: 'Quanto volete raccogliere in questo round?',
      regione: 'Dove ha sede la startup?',
    },
    summary: (n: number) => `Ho trovato ${n} investitori in linea. Ecco i primi tre, con il motivo principale:`,
    quickReplies: 'Risposte rapide',
    chips: { why: 'Perché il primo?', optin: 'Come funziona il contatto?' },
    replyWhy: (name: string, reasons: string) => `${name}: ${reasons}.`,
    replyOptin:
      'Proponi il profilo e l’investitore vede solo un teaser anonimo. I nomi arrivano solo se dite sì entrambi; un no non viene mai comunicato.',
    openReal: 'Prova l’agente vero',
    note: 'Conversazione di esempio già compilata con il profilo fittizio: le risposte rapide mostrano due repliche dell’agente.',
  },
  directoryMock: {
    lead: 'Gli investitori della demo, filtrabili per tipo. Nessun contatto diretto: le intro passano solo dal doppio consenso.',
    filterLabel: 'Filtra per tipo di investitore',
    showMore: (n: number) => `Mostra altri ${n}`,
    openReal: 'Apri la directory completa',
    note: 'Anteprima visiva: filtro per tipo e schede sintetiche. Ricerca, filtri completi e schede sono nella directory vera.',
  },
  // Shared copy of the round-3 mock screens (double opt-in inbox, teaser one-pager).
  requestsMock: {
    lead: 'Le richieste a doppio consenso: i nomi arrivano solo se dite sì entrambi.',
    tabsLabel: 'Ruolo',
    tabs: { founder: 'Come founder', investor: 'Come investitore' },
    status: { waiting: 'In attesa', 'your-turn': 'Interessato: tocca a te', intro: 'Intro', expired: 'Scaduta', 'declined-by-you': 'Hai passato' },
    investorStatus: { waiting: 'In attesa della startup', 'your-turn': 'Da valutare', intro: 'Intro', expired: 'Scaduta', 'declined-by-you': 'Hai passato' },
    daysLeft: (n: number) => (n === 1 ? 'scade tra 1 giorno' : `scade tra ${n} giorni`),
    founderNote: 'Un investitore che non risponde e uno che dice no hanno lo stesso aspetto: “In attesa”, poi “Scaduta”.',
    investorNote: 'Teaser anonimi: settore, fase, regione e round. Il nome della startup arriva solo con l’intro.',
    anonymous: 'Startup anonima',
    count: (n: number) => (n === 1 ? '1 richiesta' : `${n} richieste`),
    openReal: 'Apri le richieste vere',
    note: 'Anteprima visiva con richieste di esempio già in stati diversi: le azioni sono nella pagina vera.',
  },
  exportMock: {
    lead: 'Il profilo anonimo da mandare a un investitore: solo campi scelti, nessun nome, nessun testo del deck.',
    openReal: 'Apri l’esportazione vera',
    note: 'Anteprima del teaser con il profilo fittizio: scaricare o copiare il file si fa nella pagina vera.',
    download: 'Scarica .md',
  },
  keyboardHint: 'Tastiera',
  variants: {
    v1: {
      name: 'Editoriale',
      tagline: 'Minimal, tipografia da magazine',
      description: 'Bianco e nero con un solo accento oro, titoli grandi e molto spazio: ogni match si legge come un breve articolo.',
      pros: ['Trasmette serietà e fiducia, in linea con uno studio legale', 'Testi e motivazioni molto leggibili'],
      cons: ['Poche informazioni per schermata', 'Meno adatto a confrontare molti investitori'],
    },
    v2: {
      name: 'Dashboard',
      tagline: 'Dati densi, tabelle e filtri',
      description: 'Tabella ordinabile con barre di punteggio, filtri laterali e navigazione da tastiera: per chi valuta molti profili.',
      pros: ['Confronto rapido di molti match', 'Ordinamento e filtri immediati, uso da tastiera'],
      cons: ['Più freddo e tecnico per un founder alle prime armi', 'Su mobile va semplificato'],
    },
    v3: {
      name: 'Agente conversazionale',
      tagline: 'L’agente spiega ogni match passo passo',
      description: 'Una conversazione: l’agente presenta un match alla volta, spiega il perché e propone risposte rapide in chip.',
      pros: ['Mette al centro l’agente, il tratto distintivo del prodotto', 'Guida chi non conosce il fundraising'],
      cons: ['Più lento per chi vuole vedere tutto subito', 'Rischio di sembrare un chatbot generico'],
    },
    v4: {
      name: 'Card e swipe',
      tagline: 'Una card alla volta, Passa o Interessato',
      description: 'Un mazzo di card con progresso: si decide con i pulsanti, con lo swipe o con le frecce. Pensato per il mobile.',
      pros: ['Decisioni veloci e chiare, ottimo su telefono', 'Il doppio consenso è naturale: interessato o passa'],
      cons: ['Può sembrare un’app di incontri', 'Difficile confrontare due match tra loro'],
    },
    v5: {
      name: 'Dark premium',
      tagline: 'Nero ilTuoAvvocato, oro minimo, mono',
      description: 'Fondo nero, testo bianco e grigio, numeri in carattere monospaziato e oro solo per i dettagli chiave.',
      pros: ['Coerente con lo stile nero di ilTuoAvvocato', 'Aspetto esclusivo, adatto agli investitori'],
      cons: ['Meno leggibile alla luce del giorno e per testi lunghi', 'Stacca dal resto del toolkit, che è chiaro'],
    },
  } satisfies Record<string, VariantInfo>,
  gallery: {
    eyebrow: 'MatchInvStar · uso interno',
    title: 'Varianti di design *a confronto*',
    lead: 'Cinque direzioni di design applicate alle stesse sette schermate: landing, risultati del founder, vista dell’investitore, chat con l’agente, directory degli investitori, richieste a doppio consenso e one-pager teaser. Tutte usano il vero motore di matching e gli stessi dati di esempio fittizi.',
    screensLabel: 'Apri le schermate',
    pros: 'Pro',
    cons: 'Contro',
    preview: (name: string) => `Anteprima illustrativa della variante ${name}`,
    compareTitle: 'Confronta affiancate',
    compareLead: 'Scegli due varianti e una schermata: le vedi una accanto all’altra, interattive.',
    left: 'Variante a sinistra',
    right: 'Variante a destra',
    screen: 'Schermata',
    width: 'Larghezza',
    widths: { desktop: 'Desktop', mobile: 'Mobile' },
    frameTitle: (name: string, screen: string) => `Variante ${name}, ${screen}`,
    openFull: 'Apri a pagina intera',
    decisionTitle: 'Decisione per Vincenzo',
    decisionText:
      'Proposta: base visiva V1 Editoriale (fiducia, coerenza con lo studio), flusso del founder in stile V3 con l’agente che spiega i match, e per l’investitore la vista V4 a card su mobile con un interruttore “vista tabella” V2 su desktop. V5 come tema scuro opzionale.',
    decisionAsk: 'Da scegliere: una direzione unica oppure questa combinazione.',
  },
  v1: v1.it,
  v2: v2.it,
  v3: v3.it,
  v4: v4.it,
  v5: v5.it,
};

export type VariantsMessages = typeof it;

const en: VariantsMessages = {
  banner: {
    aria: 'Design variant',
    tag: 'Design variant – prototype',
    text: 'An alternative design direction, to compare with the others. Not the final product.',
    gallery: 'All variants',
  },
  fictional: 'Fictional sample data: startups, investors, people and amounts are made up.',
  loading: 'Loading the variant…',
  screens: {
    landing: 'Landing',
    results: 'Founder results',
    investor: 'Investor view',
    agent: 'Agent chat',
    directory: 'Investor directory',
    requests: 'Requests',
    export: 'Teaser one-pager',
  },
  screenNav: 'Screens of this variant',
  variantNav: 'Same screen in another variant',
  actions: {
    pass: 'Pass',
    interested: 'Interested',
    undo: 'Undo the last choice',
    propose: 'Propose your profile',
    proposed: 'Profile proposed',
    simulateReply: 'Simulate the startup’s answer',
    restart: 'Start again',
    why: 'Why?',
  },
  buckets: { nuovo: 'To review', passato: 'Passed', inviato: 'Interest sent', intro: 'Intro ready' },
  replyNote:
    'Simulation: some sample startups accept, others don’t. If a startup doesn’t accept you keep seeing “Interest sent”: a no is never revealed.',
  passNote: 'The startup won’t know you passed.',
  introReveal: (nome: string, founder: string) => `${nome} · founded by ${founder}`,
  founderProfile: (settore: string, fase: string, regione: string, round: string) =>
    `Sample profile: ${settore} startup, ${fase}, ${regione}, raising ${round}`,
  investorThesis: (settori: string, fasi: string, ticket: string) => `Sample thesis: ${settori} · ${fasi} · ticket ${ticket}`,
  agentMock: {
    agent: 'Agent',
    you: 'You',
    greeting: 'Hi, I’m the MatchInvStar agent. I’ll ask you four questions about your startup and suggest the investors that fit.',
    questions: {
      settore: 'Which sector is the startup in?',
      fase: 'What stage are you at?',
      round: 'How much are you raising in this round?',
      regione: 'Where is the startup based?',
    },
    summary: (n: number) => `I found ${n} investors that fit. Here are the first three, with the main reason:`,
    quickReplies: 'Quick replies',
    chips: { why: 'Why the first one?', optin: 'How does contact work?' },
    replyWhy: (name: string, reasons: string) => `${name}: ${reasons}.`,
    replyOptin:
      'Propose your profile and the investor only sees an anonymous teaser. Names are shared only if you both say yes; a no is never revealed.',
    openReal: 'Try the real agent',
    note: 'A sample conversation already filled in with the fictional profile: the quick replies show two of the agent’s answers.',
  },
  directoryMock: {
    lead: 'The demo’s investors, filterable by type. No direct contact: intros only happen through the double opt-in.',
    filterLabel: 'Filter by investor type',
    showMore: (n: number) => `Show ${n} more`,
    openReal: 'Open the full directory',
    note: 'Visual preview: type filter and short cards. Search, full filters and profiles are in the real directory.',
  },
  requestsMock: {
    lead: 'Double opt-in requests: names are shared only if you both say yes.',
    tabsLabel: 'Role',
    tabs: { founder: 'As a founder', investor: 'As an investor' },
    status: { waiting: 'Waiting', 'your-turn': 'Interested: your turn', intro: 'Intro', expired: 'Expired', 'declined-by-you': 'You passed' },
    investorStatus: { waiting: 'Waiting for the startup', 'your-turn': 'To review', intro: 'Intro', expired: 'Expired', 'declined-by-you': 'You passed' },
    daysLeft: (n: number) => (n === 1 ? 'expires in 1 day' : `expires in ${n} days`),
    founderNote: 'An investor who doesn’t answer and one who says no look the same: “Waiting”, then “Expired”.',
    investorNote: 'Anonymous teasers: sector, stage, region and round. The startup’s name comes only with the intro.',
    anonymous: 'Anonymous startup',
    count: (n: number) => (n === 1 ? '1 request' : `${n} requests`),
    openReal: 'Open the real requests',
    note: 'Visual preview with sample requests already in different states: the actions are on the real page.',
  },
  exportMock: {
    lead: 'The anonymous profile to send to an investor: chosen fields only, no names, no deck text.',
    openReal: 'Open the real export',
    note: 'Preview of the teaser with the fictional profile: downloading or copying the file happens on the real page.',
    download: 'Download .md',
  },
  keyboardHint: 'Keyboard',
  variants: {
    v1: {
      name: 'Editorial',
      tagline: 'Minimal, magazine typography',
      description: 'Black and white with a single gold accent, large headings and plenty of space: each match reads like a short article.',
      pros: ['Conveys seriousness and trust, fitting a law firm', 'Very readable copy and reasons'],
      cons: ['Little information per screen', 'Less suited to comparing many investors'],
    },
    v2: {
      name: 'Dashboard',
      tagline: 'Dense data, tables and filters',
      description: 'Sortable table with score bars, a filter sidebar and keyboard navigation: for people reviewing many profiles.',
      pros: ['Quick comparison of many matches', 'Instant sorting and filters, keyboard friendly'],
      cons: ['Colder and more technical for first-time founders', 'Needs simplifying on mobile'],
    },
    v3: {
      name: 'Conversational agent',
      tagline: 'The agent explains each match step by step',
      description: 'A conversation: the agent presents one match at a time, explains why and offers quick answers as chips.',
      pros: ['Puts the agent, the product’s distinctive trait, front and centre', 'Guides people new to fundraising'],
      cons: ['Slower for people who want to see everything at once', 'Risk of looking like a generic chatbot'],
    },
    v4: {
      name: 'Cards and swipe',
      tagline: 'One card at a time, Pass or Interested',
      description: 'A deck of cards with progress: decide with the buttons, by swiping or with the arrow keys. Built for mobile.',
      pros: ['Fast, clear decisions, great on a phone', 'Double opt-in feels natural: interested or pass'],
      cons: ['May feel like a dating app', 'Hard to compare two matches with each other'],
    },
    v5: {
      name: 'Dark premium',
      tagline: 'ilTuoAvvocato black, minimal gold, mono',
      description: 'Black background, white and grey text, figures in a monospaced face and gold only for key details.',
      pros: ['Consistent with ilTuoAvvocato’s black style', 'Exclusive look that suits investors'],
      cons: ['Less readable in daylight and for long text', 'Stands apart from the rest of the toolkit, which is light'],
    },
  },
  gallery: {
    eyebrow: 'MatchInvStar · internal',
    title: 'Design variants *side by side*',
    lead: 'Five design directions applied to the same seven screens: landing, founder results, investor view, agent chat, investor directory, double opt-in requests and teaser one-pager. All of them use the real matching engine and the same fictional sample data.',
    screensLabel: 'Open the screens',
    pros: 'Pros',
    cons: 'Cons',
    preview: (name: string) => `Illustrative preview of the ${name} variant`,
    compareTitle: 'Compare side by side',
    compareLead: 'Pick two variants and a screen: you see them next to each other, fully interactive.',
    left: 'Left variant',
    right: 'Right variant',
    screen: 'Screen',
    width: 'Width',
    widths: { desktop: 'Desktop', mobile: 'Mobile' },
    frameTitle: (name: string, screen: string) => `${name} variant, ${screen}`,
    openFull: 'Open full page',
    decisionTitle: 'Decision for Vincenzo',
    decisionText:
      'Proposal: V1 Editorial as the visual base (trust, consistent with the firm), the founder flow in V3 style with the agent explaining matches, and for investors the V4 card view on mobile with a V2 “table view” toggle on desktop. V5 as an optional dark theme.',
    decisionAsk: 'To decide: a single direction or this combination.',
  },
  v1: v1.en,
  v2: v2.en,
  v3: v3.en,
  v4: v4.en,
  v5: v5.en,
};

export default { it, en };
