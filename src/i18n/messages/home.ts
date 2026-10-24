const it = {
  eyebrow: 'Startup Legal Toolkit · gratuito',
  title: 'Gli strumenti legali per chi *fonda una startup*',
  lead: 'Tre strumenti gratuiti per dividere le quote tra soci, simulare il vesting e capire quali documenti ti servono. Così arrivi dall’avvocato con le idee già chiare.',
  ctaQuiz: 'Scopri quali documenti ti servono',
  ctaEquity: 'Calcola la ripartizione quote',
  note: 'Nessuna registrazione. Nessun dato salvato: tutto resta nel tuo browser.',
  toolsEyebrow: 'Gli strumenti',
  toolsTitle: 'Tre strumenti per partire col piede giusto',
  tools: {
    equity: {
      title: 'Ripartizione quote',
      text: 'Dividi le quote tra 2–5 cofondatori in base a idea, tempo, capitale, competenze e ruolo.',
    },
    vesting: {
      title: 'Simulatore vesting',
      text: 'Vedi come maturano le quote nel tempo e cosa succede se un founder esce al mese X.',
    },
    quiz: {
      title: 'Quali documenti mi servono?',
      text: 'Sette domande per una checklist personalizzata dei documenti legali della tua startup.',
    },
  },
  openTool: 'Apri lo strumento',
  matchBand: {
    tag: 'Prototipo dimostrativo',
    title: 'Match con investitori, con doppio consenso',
    text: 'MatchInvStar (nome provvisorio): un agente propone startup e investitori in linea, e l’intro arriva solo se dite sì entrambi. Da provare con dati di esempio.',
    cta: 'Scopri come funziona',
  },
  whyEyebrow: 'Perché pensarci subito',
  whyTitle: 'I problemi tra soci nascono *all’inizio*',
  reasons: [
    {
      title: 'Le quote decise a voce non reggono',
      text: 'All’inizio siete d’accordo su tutto. Poi cambiano l’impegno, i soldi messi, le aspettative. Un accordo scritto oggi evita discussioni domani, quando trovare un’intesa sarà più difficile.',
    },
    {
      title: 'Qualcuno potrebbe uscire presto',
      text: 'Se un socio lascia dopo pochi mesi e tiene tutte le sue quote, chi resta lavora anche per lui. Il vesting e le clausole di good/bad leaver servono proprio a questo.',
    },
    {
      title: 'Il codice scritto prima della società',
      text: 'Codice, marchio e design creati prima della costituzione, o da un freelance, in genere non appartengono automaticamente alla società. E gli investitori, di solito, lo verificano.',
    },
  ],
  docsEyebrow: 'I documenti',
  docsTitle: 'Cinque documenti da conoscere',
  docsLead: 'Non servono tutti a tutti. Il quiz ti aiuta a capire da quali partire.',
  docs: [
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
      text: 'Le quote maturano nel tempo, con un eventuale cliff iniziale e regole diverse per good e bad leaver.',
    },
    {
      title: 'Cessione IP',
      text: 'Trasferisce alla società i diritti su codice, marchio, design e contenuti, e ne tutela il valore.',
    },
  ],
  docsCta: 'Fai il quiz',
  ctaTitle: 'Hai bisogno di una mano? *Parla con un avvocato* di ilTuoAvvocato.com',
  ctaText:
    'Servizi legali online con avvocati iscritti all’Ordine: SAFE, patti tra fondatori, work for equity, vesting e tutela della proprietà intellettuale.',
  visual: {
    equity: 'Ripartizione quote',
    vesting: 'Vesting · 48 mesi, cliff 12',
    checklist: 'La tua checklist',
    patti: 'Patti tra fondatori',
    vestingClauses: 'Clausole di vesting',
    ip: 'Cessione IP',
    priority: 'Prioritario',
    recommended: 'Consigliato',
  },
};

export type HomeMessages = typeof it;

const en: HomeMessages = {
  eyebrow: 'Startup Legal Toolkit · free',
  title: 'Legal tools for people *founding a startup*',
  lead: 'Three free tools to split equity between co-founders, simulate vesting and work out which documents you need. So you reach the lawyer with a clear picture.',
  ctaQuiz: 'Find out which documents you need',
  ctaEquity: 'Calculate the equity split',
  note: 'No sign-up. No data saved: everything stays in your browser.',
  toolsEyebrow: 'The tools',
  toolsTitle: 'Three tools to start on the right foot',
  tools: {
    equity: {
      title: 'Equity split',
      text: 'Split equity between 2–5 co-founders based on idea, time, capital, skills and role.',
    },
    vesting: {
      title: 'Vesting simulator',
      text: 'See how shares vest over time and what happens if a founder leaves in month X.',
    },
    quiz: {
      title: 'Which documents do I need?',
      text: 'Seven questions for a personalised checklist of the legal documents your startup needs.',
    },
  },
  openTool: 'Open the tool',
  matchBand: {
    tag: 'Demo prototype',
    title: 'Investor matching, with double opt-in',
    text: 'MatchInvStar (working name): an agent suggests startups and investors that fit, and the intro happens only if you both say yes. Try it with sample data.',
    cta: 'See how it works',
  },
  whyEyebrow: 'Why think about it now',
  whyTitle: 'Problems between co-founders start *at the beginning*',
  reasons: [
    {
      title: 'Verbal equity deals don’t hold up',
      text: 'At the start you agree on everything. Then commitment, money put in and expectations change. A written agreement today avoids arguments tomorrow, when reaching an understanding will be harder.',
    },
    {
      title: 'Someone might leave early',
      text: 'If a co-founder leaves after a few months and keeps all their shares, the people who stay end up working for them too. Vesting and good/bad leaver clauses exist precisely for this.',
    },
    {
      title: 'Code written before the company existed',
      text: 'Code, brand and design created before incorporation, or by a freelancer, generally don’t belong to the company automatically. And investors usually check.',
    },
  ],
  docsEyebrow: 'The documents',
  docsTitle: 'Five documents worth knowing',
  docsLead: 'Not everyone needs all of them. The quiz helps you work out where to start.',
  docs: [
    {
      title: 'Founders’ agreement',
      text: 'The agreement between co-founders on equity, roles, decisions and exit. It often takes the form of a shareholders’ agreement (patto parasociale).',
    },
    {
      title: 'SAFE',
      text: 'To raise your first investment while postponing the valuation to the next round. In Italy it has to be adapted to the S.r.l. (limited liability company).',
    },
    {
      title: 'Work for equity',
      text: 'For people who work on the project for shares instead of (or on top of) pay: how many, when and on what terms.',
    },
    {
      title: 'Vesting',
      text: 'Shares vest over time, with an optional initial cliff and different rules for good and bad leavers.',
    },
    {
      title: 'IP assignment',
      text: 'Transfers the rights to code, brand, design and content to the company, and protects their value.',
    },
  ],
  docsCta: 'Take the quiz',
  ctaTitle: 'Need a hand? *Talk to a lawyer* at ilTuoAvvocato.com',
  ctaText:
    'Online legal services with lawyers registered with the Italian Bar: SAFE, founders’ agreements, work for equity, vesting and intellectual property protection.',
  visual: {
    equity: 'Equity split',
    vesting: 'Vesting · 48 months, 12-month cliff',
    checklist: 'Your checklist',
    patti: 'Founders’ agreement',
    vestingClauses: 'Vesting clauses',
    ip: 'IP assignment',
    priority: 'Priority',
    recommended: 'Recommended',
  },
};

export default { it, en };
