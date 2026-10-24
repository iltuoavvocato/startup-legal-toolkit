// Milestone 9: guided demo "Demo guidata" (split screen founder | investor, step timeline).
const it = {
  eyebrow: 'Demo guidata · dati fittizi',
  title: 'Demo guidata: startup e investitore',
  lead: 'Il doppio consenso raccontato da entrambi i lati: a sinistra la schermata della startup, a destra quella dell’investitore (sul telefono scegli quale vedere). Avanza passo per passo, oppure avvia la riproduzione.',
  fictional:
    'Startup, founder e investitore sono fittizi: il profilo è letto dal deck di esempio “Vignalume” (azienda inventata). La demo usa una casella separata in memoria: le tue richieste reali non vengono toccate.',
  timelineLabel: 'Passi della demo',
  branchLabel: 'Risposta dell’investitore',
  branch: { yes: 'Ramo A: l’investitore è interessato', no: 'Ramo B: l’investitore dice no' },
  branchShort: { yes: 'A · sì', no: 'B · no' },
  stepOf: (n: number, total: number) => `Passo ${n} di ${total}`,
  day: (n: number) => (n === 0 ? 'Giorno 0' : `Giorno ${n}`),
  prev: 'Indietro',
  next: 'Avanti',
  play: 'Avvia',
  pause: 'Pausa',
  restart: 'Ricomincia',
  reducedMotion: 'Riproduzione automatica disattivata: il sistema chiede animazioni ridotte. Usa Avanti e Indietro.',
  keysHint: 'Tastiera: frecce ← → per cambiare passo.',
  sideLabel: 'Schermata da vedere',
  sides: { founder: 'Startup', investor: 'Investitore' },
  screenTitle: { founder: 'Schermata della startup', investor: 'Schermata dell’investitore' },
  screenWho: (name: string) => `Vista di ${name}`,
  steps: {
    profile: {
      title: 'La startup crea il profilo dal deck',
      caption: 'L’agente legge il deck di esempio e propone settore, fase, regione e round. La founder conferma.',
    },
    matches: {
      title: 'L’agente trova i match',
      caption: 'Gli investitori fittizi in linea con il profilo, ordinati per affinità. Nessuno è stato ancora contattato.',
    },
    propose: {
      title: 'La startup propone il profilo',
      caption: 'Una proposta all’investitore più affine. Parte la scadenza di 14 giorni (valore provvisorio).',
    },
    teaser: {
      title: 'L’investitore vede solo il teaser anonimo',
      caption: 'Settore, fase, regione e round: nessun nome, nessun contatto. La startup resta riservata.',
    },
    interested: {
      title: 'L’investitore è interessato: tocca alla startup',
      caption: 'Ora la startup vede chi è interessato e decide. L’investitore non conosce ancora il nome.',
    },
    intro: {
      title: 'Sì da entrambi: intro',
      caption: 'Solo adesso i nomi sono rivelati a entrambe le parti e parte l’email di presentazione.',
    },
    declined: {
      title: 'L’investitore dice no',
      caption: 'La startup vede esattamente quello che vedrebbe senza alcuna risposta: “in attesa”, stessi giorni rimasti.',
    },
    expired: {
      title: 'Alla scadenza: “scaduta”',
      caption: 'Passati i 14 giorni la proposta risulta scaduta, come per chi non ha mai risposto. Si può riproporre.',
    },
  },
  noRevealTitle: 'Il no non viene mai rivelato',
  noRevealText:
    'Accanto, la stessa proposta se l’investitore non avesse mai risposto: la schermata della startup è identica, giorno per giorno.',
  silentLabel: 'Se l’investitore non avesse risposto',
  identical: 'Identica',
  founder: {
    profileTitle: 'Profilo letto dal deck',
    fromDeck: (name: string) => `Dal deck di esempio fittizio “${name}”`,
    confirmed: 'Profilo confermato',
    matchesTitle: (n: number) => `${n} investitori in linea`,
    proposedTo: 'Proposta inviata',
    nothingYet: 'Nessuna proposta inviata.',
  },
  investor: {
    emptyTitle: 'Nessuna proposta ricevuta',
    emptyText: 'L’investitore non sa nulla della startup finché non riceve una proposta.',
    incoming: 'In arrivo domani',
    incomingText: 'La proposta è partita: l’investitore la riceve come teaser anonimo.',
    chose: { yes: 'Ha risposto: “Sì, mi interessa”', no: 'Ha risposto: “No, grazie”' },
  },
  links: {
    title: 'Prova davvero',
    agent: 'Parla con l’agente',
    requests: 'Le tue richieste',
    simulator: 'Simulatore del doppio consenso',
  },
  landingLink: 'Demo guidata',
  galleryLink: 'Guarda la demo guidata (startup e investitore affiancati)',
};

const en: typeof it = {
  eyebrow: 'Guided demo · fictional data',
  title: 'Guided demo: startup and investor',
  lead: 'Double opt-in told from both sides: the startup’s screen on the left, the investor’s on the right (on a phone, pick which one to see). Step through it, or press play.',
  fictional:
    'Startup, founder and investor are fictional: the profile is read from the sample deck “Kelpwise” (an invented company). The demo uses a separate in-memory inbox: your own requests are not touched.',
  timelineLabel: 'Demo steps',
  branchLabel: 'The investor’s answer',
  branch: { yes: 'Branch A: the investor is interested', no: 'Branch B: the investor says no' },
  branchShort: { yes: 'A · yes', no: 'B · no' },
  stepOf: (n: number, total: number) => `Step ${n} of ${total}`,
  day: (n: number) => `Day ${n}`,
  prev: 'Back',
  next: 'Next',
  play: 'Play',
  pause: 'Pause',
  restart: 'Start over',
  reducedMotion: 'Autoplay is off: your system asks for reduced motion. Use Next and Back.',
  keysHint: 'Keyboard: ← → arrow keys change step.',
  sideLabel: 'Screen to show',
  sides: { founder: 'Startup', investor: 'Investor' },
  screenTitle: { founder: 'The startup’s screen', investor: 'The investor’s screen' },
  screenWho: (name: string) => `${name}’s view`,
  steps: {
    profile: {
      title: 'The startup builds its profile from the deck',
      caption: 'The agent reads the sample deck and suggests sector, stage, region and round. The founder confirms.',
    },
    matches: {
      title: 'The agent finds matches',
      caption: 'The fictional investors that fit the profile, ranked by fit. Nobody has been contacted yet.',
    },
    propose: {
      title: 'The startup proposes its profile',
      caption: 'One proposal to the best-fitting investor. The 14-day deadline starts (placeholder value).',
    },
    teaser: {
      title: 'The investor sees only the anonymous teaser',
      caption: 'Sector, stage, region and round: no name, no contact. The startup stays confidential.',
    },
    interested: {
      title: 'The investor is interested: the startup decides',
      caption: 'Now the startup sees who is interested and decides. The investor still doesn’t know the name.',
    },
    intro: {
      title: 'Both say yes: intro',
      caption: 'Only now are the names revealed to both sides, and the introduction email goes out.',
    },
    declined: {
      title: 'The investor says no',
      caption: 'The startup sees exactly what it would see with no answer at all: “waiting”, same days left.',
    },
    expired: {
      title: 'At the deadline: “expired”',
      caption: 'After 14 days the proposal shows as expired, just like one nobody answered. It can be sent again.',
    },
  },
  noRevealTitle: 'A no is never revealed',
  noRevealText:
    'Next to it, the same proposal if the investor had never answered: the startup’s screen is identical, day after day.',
  silentLabel: 'If the investor had not answered',
  identical: 'Identical',
  founder: {
    profileTitle: 'Profile read from the deck',
    fromDeck: (name: string) => `From the fictional sample deck “${name}”`,
    confirmed: 'Profile confirmed',
    matchesTitle: (n: number) => `${n} investors that fit`,
    proposedTo: 'Proposal sent',
    nothingYet: 'No proposal sent.',
  },
  investor: {
    emptyTitle: 'No proposals received',
    emptyText: 'The investor knows nothing about the startup until a proposal arrives.',
    incoming: 'Arriving tomorrow',
    incomingText: 'The proposal is on its way: the investor receives it as an anonymous teaser.',
    chose: { yes: 'Answered: “Yes, I’m interested”', no: 'Answered: “No, thanks”' },
  },
  links: {
    title: 'Try it for real',
    agent: 'Talk to the agent',
    requests: 'Your requests',
    simulator: 'Double opt-in simulator',
  },
  landingLink: 'Guided demo',
  galleryLink: 'Watch the guided demo (startup and investor side by side)',
};

export default { it, en };
