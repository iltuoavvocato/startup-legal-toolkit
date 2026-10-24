// Copy for design variant V1 "Editoriale" (see src/variants/v1/). Keys must match in it and en.
const it = {
  masthead: {
    issue: 'Numero 01',
    edition: 'Prototipo · dati di esempio',
    contents: 'In questo numero',
  },
  landing: {
    section: 'Fundraising · storia di copertina',
    title: 'Il capitale giusto si trova *per affinità*, non per caso',
    standfirst:
      'Un agente legge il profilo della tua startup, lo confronta con la tesi di ogni investitore e spiega il perché di ogni abbinamento. La presentazione avviene solo se la volete entrambi.',
    byline: 'A cura di ilTuoAvvocato.com · MatchInvStar è un nome provvisorio',
    lede: [
      'Chi raccoglie il primo round passa settimane a scrivere a investitori che non seguono il suo settore, la sua fase o la sua regione. Le risposte non arrivano, e i silenzi pesano.',
      'MatchInvStar rovescia il metodo: prima l’affinità, misurata e spiegata, poi un teaser anonimo all’investitore, e un’intro solo con il sì di entrambe le parti. Chi dice no non viene mai esposto.',
    ],
    contents: ['Come funziona', 'Un match, dal vivo', 'Cosa fa e cosa non fa'],
    howLead: 'Quattro passaggi, ciascuno sotto il controllo di una persona.',
    sampleLead: 'Calcolato in questo momento dal motore reale, sui dati di esempio fittizi.',
    sampleFirst: 'In cima alla lista',
    sampleMore: (n: number) => `Leggi tutti i ${n} match`,
    limitsLead: 'Le regole del gioco, prima di cominciare.',
    closingTitle: 'Due ingressi, una sola regola: il consenso',
    ctaFounder: 'Leggi i match del founder',
    ctaInvestor: 'Apri la vista dell’investitore',
  },
  results: {
    section: 'I tuoi match · edizione del founder',
    title: (n: number) => `${n} investitori, in ordine di affinità`,
    standfirst:
      'Ogni voce spiega perché l’investitore è in linea con il tuo round. Proponi il profilo a chi ti convince: riceverà soltanto un teaser anonimo.',
    counterLabel: 'Proposte di questo mese',
    score: (score: number, band: string) => `${score}/100 · ${band}`,
    partsLabel: 'Come si compone il punteggio',
    part: (label: string, value: number, max: number) => `${label} ${value}/${max}`,
    statusLabel: 'Stato',
    excludedLead: 'Non compaiono tra i match: ecco il motivo, in breve.',
  },
  investor: {
    section: 'Indice · vista dell’investitore',
    title: 'Startup in linea con la tua tesi',
    standfirst:
      'Teaser anonimi, in ordine di affinità. Vedi settore, regione, fase, importo e una frase: il nome compare solo se dite sì entrambi.',
    countsLabel: 'Riepilogo',
    statusLabel: 'Stato',
    about: (title: string) => `: ${title}`,
    emailSubject: 'Oggetto dell’email di presentazione',
  },
};

export type V1Copy = typeof it;

const en: V1Copy = {
  masthead: {
    issue: 'Issue 01',
    edition: 'Prototype · sample data',
    contents: 'In this issue',
  },
  landing: {
    section: 'Fundraising · cover story',
    title: 'The right capital is found *by fit*, not by chance',
    standfirst:
      'An agent reads your startup’s profile, compares it with each investor’s thesis and explains the reason behind every match. The introduction happens only if you both want it.',
    byline: 'By ilTuoAvvocato.com · MatchInvStar is a working name',
    lede: [
      'Founders raising a first round spend weeks writing to investors who don’t follow their sector, stage or region. Replies don’t come, and the silences weigh.',
      'MatchInvStar turns the method around: fit first, measured and explained, then an anonymous teaser to the investor, and an intro only when both sides say yes. Whoever says no is never exposed.',
    ],
    contents: ['How it works', 'A live match', 'What it does and doesn’t do'],
    howLead: 'Four steps, each one under a person’s control.',
    sampleLead: 'Computed right now by the real engine, on the fictional sample data.',
    sampleFirst: 'Top of the list',
    sampleMore: (n: number) => `Read all ${n} matches`,
    limitsLead: 'The rules of the game, before you start.',
    closingTitle: 'Two doors, one rule: consent',
    ctaFounder: 'Read the founder’s matches',
    ctaInvestor: 'Open the investor view',
  },
  results: {
    section: 'Your matches · founder edition',
    title: (n: number) => `${n} investors, ranked by fit`,
    standfirst:
      'Each entry explains why the investor fits your round. Propose your profile to the ones you like: they will only receive an anonymous teaser.',
    counterLabel: 'Proposals this month',
    score: (score: number, band: string) => `${score}/100 · ${band}`,
    partsLabel: 'How the score adds up',
    part: (label: string, value: number, max: number) => `${label} ${value}/${max}`,
    statusLabel: 'Status',
    excludedLead: 'They don’t appear among the matches: here is why, in short.',
  },
  investor: {
    section: 'Index · investor view',
    title: 'Startups in line with your thesis',
    standfirst:
      'Anonymous teasers, ranked by fit. You see sector, region, stage, amount and one sentence: the name appears only if you both say yes.',
    countsLabel: 'Summary',
    statusLabel: 'Status',
    about: (title: string) => `: ${title}`,
    emailSubject: 'Subject of the introduction email',
  },
};

export default { it, en };
