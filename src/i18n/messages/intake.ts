// Guided intake ("Parla con l'agente"): questions, chips, agent lines and the match explanation templates.
// The agent follows fixed rules (src/lib/intakeAgent.ts): no AI, nothing sent anywhere.

/** Values available to explanation templates (already formatted for the locale). */
export interface ExplainCtx {
  /** Investor name (founder side only). */
  nome: string;
  tipo: string;
  /** Investor's base region, or '' when unknown. */
  sede: string;
  settore: string;
  fase: string;
  /** Investor's main stage and main sector ('' for generalists). */
  faseMain: string;
  settoreMain: string;
  regione: string;
  area: string;
  round: string;
  min: string;
  max: string;
  /** Share of the round the maximum ticket covers. */
  pct: string;
  /** Startup and founder names: shown to the investor only after the intro. */
  startup: string;
  founder: string;
}

type E = (c: ExplainCtx) => string;

interface SideTemplates {
  fit: { settoreMain: E; settoreOther: E; generalist: E; ticketFull: E; ticketLead: E; faseMain: E; sameRegion: E; area: E };
  gap: { settoreNotMain: E; generalist: E; ticketPart: E; faseNotMain: E; italiaOnly: E };
}

const founderIt: SideTemplates & {
  lead: E;
  leadNoSede: E;
  next: Record<'idle' | 'passed' | 'waiting' | 'request' | 'intro' | 'declined' | 'expired', E>;
} = {
  lead: (c) => `Ti propongo ${c.nome} (${c.tipo}, sede in ${c.sede}).`,
  leadNoSede: (c) => `Ti propongo ${c.nome} (${c.tipo}).`,
  fit: {
    settoreMain: (c) => `${c.settore} è il suo settore principale`,
    settoreOther: (c) => `investe anche nel settore ${c.settore}`,
    generalist: () => 'valuta startup di tutti i settori',
    ticketFull: (c) => `con un ticket fino a ${c.max} potrebbe coprire l’intero round`,
    ticketLead: (c) => `con un ticket fino a ${c.max} (circa il ${c.pct} del round) potrebbe guidarlo`,
    faseMain: (c) => `${c.fase} è la fase in cui investe di più`,
    sameRegion: (c) => `ha sede in ${c.regione}, come te`,
    area: (c) => `investe nell’area ${c.area}, dove sei tu`,
  },
  gap: {
    settoreNotMain: (c) => `${c.settore} non è il suo focus: il suo settore principale è ${c.settoreMain}.`,
    generalist: () => 'È un investitore generalista: potrebbe conoscere meno da vicino il tuo mercato.',
    ticketPart: (c) => `Il suo ticket massimo (${c.max}) copre circa il ${c.pct} del round: serviranno altri investitori.`,
    faseNotMain: (c) => `Investe anche in fase ${c.fase}, ma la sua fase principale è ${c.faseMain}.`,
    italiaOnly: () => 'Investe in tutta Italia, senza un legame particolare con la tua area.',
  },
  next: {
    idle: (c) =>
      `Se proponi il profilo, ${c.nome} vede solo il teaser anonimo. Se gli interessa ti chiedo se vuoi l’intro; se non gli interessa non ricevi alcun rifiuto.`,
    passed: (c) => `Ok, lascio da parte ${c.nome}: non riceve nulla e non saprà di questa scelta.`,
    waiting: (c) =>
      `Proposta inviata: ${c.nome} vede solo il teaser anonimo. La trovi nelle richieste, con la scadenza; ti scrivo solo se c’è un interesse reciproco.`,
    request: (c) => `${c.nome} è interessato e ha già detto sì. Vuoi l’intro? Se dici di no, non lo saprà.`,
    intro: (c) => `Avete detto sì entrambi: vi ho presentati con un’email. Da qui la conversazione con ${c.nome} è vostra.`,
    declined: (c) => `Hai detto di no: ${c.nome} non riceverà alcuna notifica del rifiuto.`,
    expired: (c) =>
      `Nessuna intro con ${c.nome} entro la scadenza: può succedere per tanti motivi. Se vuoi, puoi proporre di nuovo il profilo.`,
  },
};

const investorIt: SideTemplates & { lead: E; next: Record<'idle' | 'passed' | 'waiting' | 'noNews' | 'intro', E> } = {
  lead: (c) => `Una startup ${c.settore} in fase ${c.fase}, con sede in ${c.regione}, cerca ${c.round}.`,
  fit: {
    settoreMain: (c) => `${c.settore} è il tuo settore principale`,
    settoreOther: (c) => `${c.settore} è tra i settori che segui`,
    generalist: () => 'valuti tutti i settori',
    ticketFull: (c) => `con un ticket fino a ${c.max} potresti coprire l’intero round`,
    ticketLead: (c) => `con un ticket fino a ${c.max} (circa il ${c.pct} del round) potresti guidarlo`,
    faseMain: (c) => `${c.fase} è la tua fase principale`,
    sameRegion: (c) => `ha sede in ${c.regione}, come te`,
    area: (c) => `ha sede nell’area ${c.area}, che segui`,
  },
  gap: {
    settoreNotMain: (c) => `${c.settore} non è il tuo focus principale (${c.settoreMain}).`,
    generalist: () => 'Non hai indicato un settore preferito: il punteggio di settore è più basso.',
    ticketPart: (c) => `Il tuo ticket massimo copre circa il ${c.pct} del round: servirebbero altri investitori.`,
    faseNotMain: (c) => `È in fase ${c.fase}, che segui ma non è la tua fase principale (${c.faseMain}).`,
    italiaOnly: () => 'Investi in tutta Italia: nessun punto in più per la vicinanza.',
  },
  next: {
    idle: () =>
      'Se ti interessa, la startup riceve la tua richiesta e decide se accettare l’intro. Il suo nome lo vedi solo se accetta; se passi, non saprà nulla.',
    passed: () => 'Ok, non te la ripropongo. La startup non riceverà alcuna notifica del tuo no.',
    waiting: () => 'Interesse inviato. Ti presento solo se anche la startup accetta: fino ad allora il nome resta riservato.',
    noNews: () =>
      'Nessuna risposta dalla startup per ora. Se non è interessata non te lo diremo: semplicemente l’intro non arriva.',
    intro: (c) => `La startup ha accettato: è ${c.startup}, fondata da ${c.founder}. Vi ho presentati con un’email.`,
  },
};

const founderEn: typeof founderIt = {
  lead: (c) => `I suggest ${c.nome} (${c.tipo}, based in ${c.sede}).`,
  leadNoSede: (c) => `I suggest ${c.nome} (${c.tipo}).`,
  fit: {
    settoreMain: (c) => `${c.settore} is its main sector`,
    settoreOther: (c) => `it also invests in ${c.settore}`,
    generalist: () => 'it looks at startups in every sector',
    ticketFull: (c) => `with tickets of up to ${c.max} it could cover the whole round`,
    ticketLead: (c) => `with tickets of up to ${c.max} (about ${c.pct} of the round) it could lead it`,
    faseMain: (c) => `${c.fase} is the stage it invests in most`,
    sameRegion: (c) => `it’s based in ${c.regione}, like you`,
    area: (c) => `it invests in the ${c.area}, where you are`,
  },
  gap: {
    settoreNotMain: (c) => `${c.settore} isn’t its focus: its main sector is ${c.settoreMain}.`,
    generalist: () => 'It’s a generalist investor: it may know your market less closely.',
    ticketPart: (c) => `Its maximum ticket (${c.max}) covers about ${c.pct} of the round: you’ll need other investors.`,
    faseNotMain: (c) => `It also invests at ${c.fase}, but its main stage is ${c.faseMain}.`,
    italiaOnly: () => 'It invests across Italy, with no particular tie to your area.',
  },
  next: {
    idle: (c) =>
      `If you propose your profile, ${c.nome} only sees the anonymous teaser. If they’re interested I’ll ask whether you want the intro; if not, you won’t get any rejection.`,
    passed: (c) => `OK, I’ll set ${c.nome} aside: they receive nothing and won’t know about this choice.`,
    waiting: (c) =>
      `Proposal sent: ${c.nome} only sees the anonymous teaser. You’ll find it in your requests, with its deadline; I’ll only get back to you if the interest is mutual.`,
    request: (c) => `${c.nome} is interested and has already said yes. Do you want the intro? If you say no, they won’t know.`,
    intro: (c) => `You both said yes: I’ve introduced you by email. From here the conversation with ${c.nome} is yours.`,
    declined: (c) => `You said no: ${c.nome} won’t be notified that you declined.`,
    expired: (c) => `No intro with ${c.nome} before the deadline: that can happen for many reasons. You can propose your profile again if you like.`,
  },
};

const investorEn: typeof investorIt = {
  lead: (c) => `A ${c.settore} startup at ${c.fase} stage, based in ${c.regione}, is raising ${c.round}.`,
  fit: {
    settoreMain: (c) => `${c.settore} is your main sector`,
    settoreOther: (c) => `${c.settore} is one of the sectors you follow`,
    generalist: () => 'you look at every sector',
    ticketFull: (c) => `with tickets of up to ${c.max} you could cover the whole round`,
    ticketLead: (c) => `with tickets of up to ${c.max} (about ${c.pct} of the round) you could lead it`,
    faseMain: (c) => `${c.fase} is your main stage`,
    sameRegion: (c) => `it’s based in ${c.regione}, like you`,
    area: (c) => `it’s based in the ${c.area}, an area you follow`,
  },
  gap: {
    settoreNotMain: (c) => `${c.settore} isn’t your main focus (${c.settoreMain}).`,
    generalist: () => 'You didn’t pick a preferred sector: the sector score is lower.',
    ticketPart: (c) => `Your maximum ticket covers about ${c.pct} of the round: other investors would be needed.`,
    faseNotMain: (c) => `It’s at ${c.fase} stage, which you follow but isn’t your main stage (${c.faseMain}).`,
    italiaOnly: () => 'You invest across Italy: no extra points for proximity.',
  },
  next: {
    idle: () =>
      'If you’re interested, the startup gets your request and decides whether to accept the intro. You only see its name if it accepts; if you pass, it won’t know.',
    passed: () => 'OK, I won’t suggest it again. The startup won’t be notified of your no.',
    waiting: () => 'Interest sent. I’ll introduce you only if the startup accepts too: until then its name stays confidential.',
    noNews: () => 'No answer from the startup for now. If it’s not interested we won’t tell you: the intro simply doesn’t happen.',
    intro: (c) => `The startup accepted: it’s ${c.startup}, founded by ${c.founder}. I’ve introduced you by email.`,
  },
};

const it = {
  ui: {
    modeLabel: 'Come vuoi procedere?',
    talk: 'Parla con l’agente',
    talkHint: 'Una domanda alla volta, risposte con un clic',
    form: 'Compila il modulo',
    formHint: 'Tutti i campi in una pagina',
    startup: {
      eyebrow: 'Match investitori · startup · agente',
      title: 'Racconta il tuo round *all’agente*',
      lead: 'Una domanda alla volta: settore, fase, importo e sede. Se vuoi, aggiungi il deck e l’agente ti chiede conferma di quello che trova. Prototipo dimostrativo con dati di esempio.',
      summaryTitle: 'Il tuo profilo',
      summaryNote: 'Cosa userà l’agente per cercare gli investitori. Nessun nome: il teaser resta anonimo.',
    },
    investor: {
      eyebrow: 'Match investitori · investitore · agente',
      title: 'Racconta la tua tesi *all’agente*',
      lead: 'Settori, fasi, ticket e aree, una domanda alla volta. Poi l’agente ti propone teaser anonimi di startup in linea. Prototipo dimostrativo con dati di esempio.',
      summaryTitle: 'La tua tesi',
      summaryNote: 'Cosa userà l’agente per scegliere le startup da proporti.',
    },
    agentName: 'Agente MatchInvStar',
    agentRole: 'Segue regole fisse, senza intelligenza artificiale',
    logLabel: 'Conversazione con l’agente',
    you: 'Tu',
    typing: 'L’agente sta scrivendo…',
    skipAnimation: 'Salta l’animazione',
    restart: 'Ricomincia',
    restartDone: 'Conversazione ricominciata.',
    edit: 'Modifica',
    editSr: (label: string) => ` la risposta: ${label}`,
    back: 'Indietro',
    send: 'Invia',
    skip: 'Salta',
    confirmChoice: 'Conferma',
    selected: (n: number) => (n === 1 ? '1 selezionato' : `${n} selezionati`),
    suggestedTag: 'dal deck',
    progress: (done: number, total: number) => `${done} di ${total} risposte`,
    summaryToggle: 'Mostra il profilo',
    empty: 'Da chiedere',
    skipped: 'Saltato',
    fromDeck: (page: number) => `dal deck, p. ${page}`,
    fromYou: 'da te',
    labels: {
      settore: 'Settore',
      fase: 'Fase',
      round: 'Importo del round',
      regione: 'Sede',
      oneLiner: 'Pitch anonimo',
      settori: 'Settori',
      fasi: 'Fasi',
      ticket: 'Ticket',
      aree: 'Aree',
      sede: 'La tua sede',
    },
    amountLabel: 'Importo in euro',
    amountRead: (amount: string) => `Hai scritto ${amount}.`,
    minLabel: 'Ticket minimo, in euro',
    maxLabel: 'Ticket massimo, in euro',
    textLabel: 'La tua risposta',
    textCount: (n: number, max: number) => `${n}/${max}`,
    attach: 'Aggiungi il deck (PDF)',
    attachHint: 'Puoi aggiungere il deck in qualsiasi momento prima della ricerca: viene letto nel tuo browser.',
    dropHere: 'Rilascia qui il PDF',
    pickDeck: 'Scegli il PDF',
    sampleDeck: 'Prova con un deck di esempio',
    reading: (page: number, total: number) => `Lettura della pagina ${page} di ${total}…`,
    readingStart: 'Apro il PDF…',
    storageNote: 'La conversazione resta solo in questa scheda del browser (sessionStorage) e si cancella con “Ricomincia”. Il testo del deck non viene mai salvato.',
    formLink: 'Preferisci il modulo?',
    talkLink: 'Preferisci la conversazione?',
    errors: {
      required: 'Scegli almeno un’opzione, oppure scrivi una risposta.',
      positive: 'Indica un importo maggiore di zero.',
      tooBig: 'L’importo è troppo alto: controlla gli zeri.',
      order: 'Il ticket minimo non può superare il massimo.',
      tooLong: 'Il testo è troppo lungo.',
      invalid: 'Questa risposta non è tra le opzioni.',
    },
    matchesLabel: (n: number) => `Match ${n}`,
    proposalsLeft: (left: number, limit: number) =>
      `Proposte rimaste a questo mese: ${left} di ${limit} (valore provvisorio). Il contatore è lo stesso del modulo e della directory.`,
    actions: {
      propose: 'Proponi il profilo',
      pass: 'Lascia stare',
      proposeAgain: 'Proponi di nuovo',
      introYes: 'Accetta l’intro',
      introNo: 'Non ora',
      interested: 'Mi interessa',
      passInvestor: 'Passa',
      excluded: 'Perché alcuni non compaiono?',
      editProfile: 'Modifica il profilo',
      editThesis: 'Modifica la tesi',
      optinPage: 'Apri il simulatore del doppio consenso',
    },
    actionSr: (name: string) => `: ${name}`,
    limitReached: (limit: number) => `Hai raggiunto il limite di ${limit} proposte per questo mese (valore provvisorio): non ho inviato nulla.`,
    emailToggle: 'Vedi l’email di presentazione',
    gapsTitle: 'Cosa non torna',
    whyTitle: 'Perché è in linea',
    nextTitle: 'Prossimo passo',
    signalsNote: (list: string) => `Dal tuo deck citerei anche: ${list} (non entra nel punteggio).`,
  },
  hello: {
    startup:
      'Ciao! Sono l’agente di MatchInvStar (nome provvisorio). Ti faccio qualche domanda sul tuo round e poi ti propongo gli investitori più in linea, spiegandoti il perché. Seguo regole fisse, senza intelligenza artificiale, e nulla lascia il tuo browser.',
    investor:
      'Ciao! Sono l’agente di MatchInvStar (nome provvisorio). Ti faccio cinque domande sulla tua tesi e poi ti propongo startup in linea, in forma anonima. Seguo regole fisse, senza intelligenza artificiale, e nulla lascia il tuo browser.',
  },
  questions: {
    deck: 'Hai un pitch deck in PDF? Se me lo dai lo leggo qui, nel tuo browser, e ti chiedo conferma di quello che trovo. Altrimenti ti faccio io le domande.',
    settore: 'In che settore opera la startup?',
    fase: 'In che fase siete?',
    round: (fase: string) => (fase ? `Quanto volete raccogliere? Per un round ${fase} di solito si vedono importi come questi:` : 'Quanto volete raccogliere in questo round?'),
    roundCheck: (round: string, fase: string) => `${round} è un importo insolito per un round ${fase}. È corretto?`,
    regione: 'In quale regione ha sede la startup?',
    oneLiner:
      'Ultima cosa: descrivi la startup in una frase, senza il nome. È ciò che legge l’investitore nel teaser anonimo. Puoi anche saltare.',
    confirm: 'Ho tutto quello che mi serve. Controlla il riquadro del profilo e, se va bene, cerco gli investitori.',
    settori: 'Quali settori segui? Puoi sceglierne più di uno: il primo conta come principale.',
    fasi: 'In quali fasi investi?',
    ticket: (fasi: string) =>
      fasi ? `Qual è il tuo ticket, dal minimo al massimo? Per ${fasi} questi intervalli sono comuni:` : 'Qual è il tuo ticket, dal minimo al massimo?',
    aree: 'In quali aree d’Italia investi?',
    sede: 'In che regione hai sede? Le startup vicine ottengono qualche punto in più. Puoi saltare.',
    confirmInvestor: 'Ho tutto quello che mi serve. Controlla il riquadro della tesi e, se va bene, cerco le startup.',
    edit: (label: string) => `Va bene, cambiamo: ${label.toLowerCase()}.`,
    deckFinding: {
      settore: (value: string, page: number) => `Nel deck (p. ${page}) leggo che il settore è ${value}. Confermi?`,
      fase: (value: string, page: number) => `Nel deck (p. ${page}) leggo che siete in fase ${value}. Confermi?`,
      round: (value: string, page: number) => `Nel deck (p. ${page}) leggo che cercate ${value}. Confermi l’importo?`,
      regione: (value: string, page: number) => `Nel deck (p. ${page}) leggo che la sede è a ${value}. Confermi?`,
      oneLiner: (page: number) => `Ho trovato questa frase in copertina (p. ${page}). La uso come pitch anonimo?`,
      extras: (list: string) => `Ho trovato anche: ${list}. Non entrano nel punteggio, ma posso citarli nelle spiegazioni dei match. Li uso?`,
    },
    conflict: (yours: string) => `Prima mi avevi detto: ${yours}. Se confermi, uso il valore del deck.`,
    currency: (cur: string) => `Attenzione: nel deck l’importo è in ${cur}, lo tratto come euro. Se non va, scegli Modifica.`,
    confidence: { alta: 'affidabilità alta', media: 'affidabilità media', bassa: 'affidabilità bassa' },
    quoteLabel: (page: number) => `Dal deck, pagina ${page}`,
    notKept: 'Il testo del deck non viene conservato dopo il ricaricamento.',
  },
  choices: {
    deck: { skip: 'Continua senza deck' },
    roundCheck: { ok: 'Sì, è corretto', change: 'Cambio l’importo' },
    confirm: { go: 'Cerca i match' },
    deckFinding: { accept: 'Sì, usalo', edit: 'Modifica', ignore: 'No, ignora' },
    extras: { accept: 'Sì, citali', ignore: 'No' },
  },
  user: {
    deckPicked: 'Ecco il mio deck.',
    excluded: 'Perché alcuni non compaiono?',
  },
  deck: {
    reading: 'Sto leggendo il deck sul tuo dispositivo…',
    read: (pages: number, found: number) =>
      found === 0
        ? `Ho letto ${pages === 1 ? '1 pagina' : `${pages} pagine`} ma non ho trovato elementi utili. Nessun problema: ti faccio io le domande.`
        : `Ho letto ${pages === 1 ? '1 pagina' : `${pages} pagine`} e ho trovato ${found === 1 ? '1 elemento' : `${found} elementi`}. Te li chiedo uno alla volta: niente viene usato senza la tua conferma.`,
    error: 'Puoi continuare senza deck: ti faccio io le domande.',
  },
  results: {
    intro: (n: number) =>
      n === 0
        ? 'Con questo profilo nessun investitore di esempio è compatibile. Puoi vedere perché qui sotto, oppure modificare fase, sede o importo.'
        : `Ho trovato ${n === 1 ? '1 investitore in linea' : `${n} investitori in linea`}, dal più affine. Per ognuno ti dico perché, cosa non torna e come funziona il passo successivo.`,
    introInvestor: (n: number) =>
      n === 0
        ? 'Con questa tesi nessuna startup di esempio è compatibile. Puoi vedere perché qui sotto, oppure allargare fasi, aree o ticket.'
        : `Ho trovato ${n === 1 ? '1 startup in linea' : `${n} startup in linea`}. Vedi solo teaser anonimi: il nome arriva con l’intro, se dite sì entrambi.`,
    fromDeck: (list: string) => `Dal tuo deck ho usato: ${list}.`,
    wrap: (excluded: number) =>
      excluded === 0
        ? 'Questo è tutto. Puoi modificare una risposta in qualsiasi momento o ricominciare.'
        : `Questo è tutto. ${excluded === 1 ? '1 profilo di esempio è stato escluso' : `${excluded} profili di esempio sono stati esclusi`} dai filtri: vuoi sapere perché?`,
    excluded: 'Ecco chi ho escluso e perché:',
    restored: 'Riprendiamo da dove eravamo rimasti.',
  },
  explain: {
    fitsSentence: (list: string) => `${list}.`,
    noGaps: 'Sui criteri del prototipo non vedo punti deboli evidenti.',
    founder: founderIt,
    investor: investorIt,
  },
  range: (min: string, max: string) => `da ${min} a ${max}`,
  skipped: 'Preferisco saltare',
  and: 'e',
};

const en: typeof it = {
  ui: {
    modeLabel: 'How would you like to go about it?',
    talk: 'Talk to the agent',
    talkHint: 'One question at a time, one-click answers',
    form: 'Fill in the form',
    formHint: 'All fields on one page',
    startup: {
      eyebrow: 'Investor matching · startup · agent',
      title: 'Tell the agent *about your round*',
      lead: 'One question at a time: sector, stage, amount and location. If you like, add your deck and the agent asks you to confirm what it finds. Demo prototype with sample data.',
      summaryTitle: 'Your profile',
      summaryNote: 'What the agent will use to find investors. No names: the teaser stays anonymous.',
    },
    investor: {
      eyebrow: 'Investor matching · investor · agent',
      title: 'Tell the agent *about your thesis*',
      lead: 'Sectors, stages, ticket and regions, one question at a time. Then the agent suggests anonymous teasers of startups that fit. Demo prototype with sample data.',
      summaryTitle: 'Your thesis',
      summaryNote: 'What the agent will use to pick the startups it suggests.',
    },
    agentName: 'MatchInvStar agent',
    agentRole: 'Follows fixed rules, not AI',
    logLabel: 'Conversation with the agent',
    you: 'You',
    typing: 'The agent is typing…',
    skipAnimation: 'Skip the animation',
    restart: 'Start over',
    restartDone: 'Conversation restarted.',
    edit: 'Edit',
    editSr: (label: string) => ` the answer: ${label}`,
    back: 'Back',
    send: 'Send',
    skip: 'Skip',
    confirmChoice: 'Confirm',
    selected: (n: number) => `${n} selected`,
    suggestedTag: 'from the deck',
    progress: (done: number, total: number) => `${done} of ${total} answers`,
    summaryToggle: 'Show the profile',
    empty: 'Still to ask',
    skipped: 'Skipped',
    fromDeck: (page: number) => `from the deck, p. ${page}`,
    fromYou: 'from you',
    labels: {
      settore: 'Sector',
      fase: 'Stage',
      round: 'Round size',
      regione: 'Location',
      oneLiner: 'Anonymous pitch',
      settori: 'Sectors',
      fasi: 'Stages',
      ticket: 'Ticket',
      aree: 'Regions',
      sede: 'Your location',
    },
    amountLabel: 'Amount in euros',
    amountRead: (amount: string) => `You typed ${amount}.`,
    minLabel: 'Minimum ticket, in euros',
    maxLabel: 'Maximum ticket, in euros',
    textLabel: 'Your answer',
    textCount: (n: number, max: number) => `${n}/${max}`,
    attach: 'Add your deck (PDF)',
    attachHint: 'You can add the deck at any time before the search: it’s read in your browser.',
    dropHere: 'Drop the PDF here',
    pickDeck: 'Choose the PDF',
    sampleDeck: 'Try a sample deck',
    reading: (page: number, total: number) => `Reading page ${page} of ${total}…`,
    readingStart: 'Opening the PDF…',
    storageNote: 'The conversation is kept only in this browser tab (sessionStorage) and is deleted with “Start over”. The deck’s text is never saved.',
    formLink: 'Prefer the form?',
    talkLink: 'Prefer the conversation?',
    errors: {
      required: 'Pick at least one option, or type an answer.',
      positive: 'Enter an amount greater than zero.',
      tooBig: 'That amount is too high: check the zeros.',
      order: 'The minimum ticket can’t be higher than the maximum.',
      tooLong: 'The text is too long.',
      invalid: 'That answer isn’t one of the options.',
    },
    matchesLabel: (n: number) => `Match ${n}`,
    proposalsLeft: (left: number, limit: number) =>
      `Proposals left this month: ${left} of ${limit} (provisional value). The counter is shared with the form and the directory.`,
    actions: {
      propose: 'Propose your profile',
      pass: 'Skip this one',
      proposeAgain: 'Propose again',
      introYes: 'Accept the intro',
      introNo: 'Not now',
      interested: 'I’m interested',
      passInvestor: 'Pass',
      excluded: 'Why are some missing?',
      editProfile: 'Edit the profile',
      editThesis: 'Edit the thesis',
      optinPage: 'Open the double opt-in simulator',
    },
    actionSr: (name: string) => `: ${name}`,
    limitReached: (limit: number) => `You’ve reached the limit of ${limit} proposals for this month (provisional value): nothing was sent.`,
    emailToggle: 'See the introduction email',
    gapsTitle: 'What doesn’t fit',
    whyTitle: 'Why it fits',
    nextTitle: 'Next step',
    signalsNote: (list: string) => `From your deck I’d also mention: ${list} (not part of the score).`,
  },
  hello: {
    startup:
      'Hi! I’m the MatchInvStar agent (working name). I’ll ask you a few questions about your round, then suggest the investors that fit best and explain why. I follow fixed rules, not AI, and nothing leaves your browser.',
    investor:
      'Hi! I’m the MatchInvStar agent (working name). I’ll ask you five questions about your thesis, then suggest startups that fit, anonymously. I follow fixed rules, not AI, and nothing leaves your browser.',
  },
  questions: {
    deck: 'Do you have a pitch deck as a PDF? If you give it to me I’ll read it here, in your browser, and ask you to confirm what I find. Otherwise I’ll ask the questions myself.',
    settore: 'Which sector is the startup in?',
    fase: 'What stage are you at?',
    round: (fase: string) => (fase ? `How much are you raising? For a ${fase} round, amounts like these are common:` : 'How much are you raising in this round?'),
    roundCheck: (round: string, fase: string) => `${round} is an unusual amount for a ${fase} round. Is that right?`,
    regione: 'Which region is the startup based in?',
    oneLiner: 'Last thing: describe the startup in one sentence, without its name. It’s what investors read in the anonymous teaser. You can skip this.',
    confirm: 'I have everything I need. Check the profile panel and, if it looks right, I’ll look for investors.',
    settori: 'Which sectors do you follow? You can pick more than one: the first counts as your main sector.',
    fasi: 'Which stages do you invest in?',
    ticket: (fasi: string) =>
      fasi ? `What’s your ticket, from minimum to maximum? For ${fasi} these ranges are common:` : 'What’s your ticket, from minimum to maximum?',
    aree: 'Which parts of Italy do you invest in?',
    sede: 'Which region are you based in? Nearby startups get a few extra points. You can skip this.',
    confirmInvestor: 'I have everything I need. Check the thesis panel and, if it looks right, I’ll look for startups.',
    edit: (label: string) => `Sure, let’s change it: ${label.toLowerCase()}.`,
    deckFinding: {
      settore: (value: string, page: number) => `In the deck (p. ${page}) I read that the sector is ${value}. Is that right?`,
      fase: (value: string, page: number) => `In the deck (p. ${page}) I read that you’re at ${value} stage. Is that right?`,
      round: (value: string, page: number) => `In the deck (p. ${page}) I read that you’re raising ${value}. Is the amount right?`,
      regione: (value: string, page: number) => `In the deck (p. ${page}) I read that you’re based in ${value}. Is that right?`,
      oneLiner: (page: number) => `I found this sentence on the cover (p. ${page}). Shall I use it as the anonymous pitch?`,
      extras: (list: string) => `I also found: ${list}. They don’t count towards the score, but I can mention them when I explain the matches. Shall I?`,
    },
    conflict: (yours: string) => `Earlier you told me: ${yours}. If you confirm, I’ll use the deck’s value.`,
    currency: (cur: string) => `Note: the deck gives the amount in ${cur}; I’ll treat it as euros. If that’s wrong, choose Edit.`,
    confidence: { alta: 'high confidence', media: 'medium confidence', bassa: 'low confidence' },
    quoteLabel: (page: number) => `From the deck, page ${page}`,
    notKept: 'The deck’s text isn’t kept after a reload.',
  },
  choices: {
    deck: { skip: 'Continue without a deck' },
    roundCheck: { ok: 'Yes, that’s right', change: 'Change the amount' },
    confirm: { go: 'Find matches' },
    deckFinding: { accept: 'Yes, use it', edit: 'Edit', ignore: 'No, ignore it' },
    extras: { accept: 'Yes, mention them', ignore: 'No' },
  },
  user: {
    deckPicked: 'Here’s my deck.',
    excluded: 'Why are some missing?',
  },
  deck: {
    reading: 'I’m reading the deck on your device…',
    read: (pages: number, found: number) =>
      found === 0
        ? `I read ${pages === 1 ? '1 page' : `${pages} pages`} but found nothing useful. No problem: I’ll ask the questions myself.`
        : `I read ${pages === 1 ? '1 page' : `${pages} pages`} and found ${found === 1 ? '1 item' : `${found} items`}. I’ll go through them one at a time: nothing is used without your confirmation.`,
    error: 'You can carry on without a deck: I’ll ask the questions myself.',
  },
  results: {
    intro: (n: number) =>
      n === 0
        ? 'With this profile none of the sample investors fits. You can see why below, or change the stage, location or amount.'
        : `I found ${n === 1 ? '1 investor that fits' : `${n} investors that fit`}, best first. For each one I’ll tell you why, what doesn’t fit and how the next step works.`,
    introInvestor: (n: number) =>
      n === 0
        ? 'With this thesis none of the sample startups fits. You can see why below, or widen the stages, regions or ticket.'
        : `I found ${n === 1 ? '1 startup that fits' : `${n} startups that fit`}. You only see anonymous teasers: the name comes with the intro, if you both say yes.`,
    fromDeck: (list: string) => `From your deck I used: ${list}.`,
    wrap: (excluded: number) =>
      excluded === 0
        ? 'That’s everything. You can change an answer at any time or start over.'
        : `That’s everything. ${excluded === 1 ? '1 sample profile was' : `${excluded} sample profiles were`} filtered out: want to know why?`,
    excluded: 'Here’s who I left out and why:',
    restored: 'Let’s pick up where we left off.',
  },
  explain: {
    fitsSentence: (list: string) => `${list}.`,
    noGaps: 'On the prototype’s criteria I see no obvious weak points.',
    founder: founderEn,
    investor: investorEn,
  },
  range: (min: string, max: string) => `${min} to ${max}`,
  skipped: 'I’d rather skip',
  and: 'and',
};

export default { it, en };
