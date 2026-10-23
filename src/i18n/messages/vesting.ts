const it = {
  title: 'Simulatore *vesting*',
  lead: 'Con il vesting le quote di un founder maturano nel tempo. Imposta durata, cliff e frequenza e scopri cosa succede se un socio lascia il progetto in un certo mese.',
  months: (n: string, count: number) => `${n} ${count === 1 ? 'mese' : 'mesi'}`,
  years: (n: number) => `${n} ${n === 1 ? 'anno' : 'anni'}`,
  params: 'Parametri',
  stake: 'Quote totali del founder',
  stakeDisplay: (pct: string) => `${pct} della società`,
  duration: 'Durata del vesting',
  cliff: 'Cliff',
  noCliff: 'nessun cliff',
  cliffHint:
    'Periodo iniziale in cui non matura nulla; alla scadenza matura in una volta sola quanto accumulato fino a quel momento.',
  frequency: 'Frequenza di maturazione',
  frequencies: { mensile: 'Mensile', trimestrale: 'Trimestrale', annuale: 'Annuale' },
  startDate: 'Data di inizio',
  startLabel: 'Inizio:',
  chartTitle: 'Quote maturate nel tempo',
  leaverSlider: 'Il founder esce al mese',
  table: 'Tabella di maturazione',
  tableCaption: 'Quote maturate per mese',
  tableHead: { month: 'Mese', date: 'Data', package: 'Del pacchetto', company: 'Della società' },
  leaverTitle: (m: number) => `Cosa succede se esce al mese ${m}`,
  exitOn: (date: string) => `Uscita il ${date}`,
  vested: 'Quote maturate',
  unvested: 'Quote non maturate',
  ofPackage: (pct: string) => `${pct} del suo pacchetto`,
  founderTotalBefore: 'Totale del founder:',
  founderTotalAfter: 'della società',
  leaverType: 'Tipo di uscita',
  goodExamples: '**Good leaver**: per esempio malattia, licenziamento senza giusta causa, uscita concordata.',
  goodText: (vested: string, unvested: string) =>
    `In genere conserva le quote maturate (${vested} della società). Le quote non maturate (${unvested}) tornano alla società o agli altri soci, di solito con un riacquisto a valore nominale o di mercato, secondo quanto previsto negli accordi.`,
  badExamples:
    '**Bad leaver**: per esempio dimissioni prima di un termine concordato, violazione del patto di non concorrenza, licenziamento per giusta causa.',
  badText: (vested: string, unvested: string) =>
    `Le quote non maturate (${unvested}) tornano alla società o agli altri soci. In più, gli accordi possono prevedere che perda anche parte o tutte le quote maturate (${vested}), o che debba cederle a un prezzo penalizzante (per esempio al valore nominale).`,
  leaverNote:
    'Queste sono opzioni contrattuali tipiche, non regole di legge: vanno definite nei patti tra fondatori. In una s.r.l. il vesting di solito si realizza con patti parasociali, opzioni call o clausole statutarie.',
  exampleEyebrow: 'Esempio rapido',
  exampleTitle: '4 anni di vesting, cliff di 1 anno',
  exampleLead: 'Il founder ha il 25% della società, che matura mese per mese in 48 mesi.',
  examples: [
    { label: 'Esce a 11 mesi', value: '0%', note: 'il cliff non è ancora passato' },
    { label: 'Esce a 12 mesi', value: '25%', note: 'del suo pacchetto, cioè il 6,25% della società' },
    { label: 'Esce a 30 mesi', value: '62,5%', note: 'del suo pacchetto, cioè il 15,63% della società' },
  ],
  whyTitle: 'Perché il vesting conviene a tutti',
  whyText1:
    'Le quote assegnate al momento della costituzione premiano un lavoro che in gran parte deve ancora essere fatto. Con il vesting, chi resta non si trova a dividere la società con chi ha smesso di contribuire, e chi entra sa che il suo impegno verrà riconosciuto nel tempo.',
  whyText2:
    'Gli investitori, di solito, lo guardano con favore: è un segnale che il team ha pensato al proprio futuro. Se non avete ancora deciso come dividere le quote, parti dal [calcolatore](@equity).',
  ctaTitle: 'Vuoi mettere il vesting nero su bianco?',
  ctaText:
    'Un avvocato di ilTuoAvvocato.com può aiutarti a scrivere clausole di vesting e di good/bad leaver adatte alla tua s.r.l.',
  chart: {
    aria: (cliff: number, duration: number, exit: number, pct: string) =>
      `Grafico della maturazione: 0% fino al mese ${cliff}, poi crescita fino al 100% al mese ${duration}. Uscita al mese ${exit}: maturato ${pct} del pacchetto.`,
    cliff: (m: number) => `Cliff · mese ${m}`,
    markerShort: (m: number, pct: string) => `Mese ${m}: ${pct}`,
    markerLong: (m: number, pct: string) => `Esce al mese ${m}: ${pct}`,
    drag: 'Trascina sul grafico per spostare l’uscita',
  },
};

export type VestingMessages = typeof it;

const en: VestingMessages = {
  title: 'Vesting *simulator*',
  lead: 'With vesting, a founder’s shares are earned over time. Set the duration, cliff and frequency and see what happens if a co-founder leaves the project in a given month.',
  months: (n: string, count: number) => `${n} ${count === 1 ? 'month' : 'months'}`,
  years: (n: number) => `${n} ${n === 1 ? 'year' : 'years'}`,
  params: 'Parameters',
  stake: 'Founder’s total stake',
  stakeDisplay: (pct: string) => `${pct} of the company`,
  duration: 'Vesting period',
  cliff: 'Cliff',
  noCliff: 'no cliff',
  cliffHint:
    'An initial period in which nothing vests; when it ends, everything accrued up to that point vests at once.',
  frequency: 'Vesting frequency',
  frequencies: { mensile: 'Monthly', trimestrale: 'Quarterly', annuale: 'Annual' },
  startDate: 'Start date',
  startLabel: 'Start:',
  chartTitle: 'Shares vested over time',
  leaverSlider: 'The founder leaves in month',
  table: 'Vesting schedule',
  tableCaption: 'Shares vested by month',
  tableHead: { month: 'Month', date: 'Date', package: 'Of the package', company: 'Of the company' },
  leaverTitle: (m: number) => `What happens if they leave in month ${m}`,
  exitOn: (date: string) => `Leaves on ${date}`,
  vested: 'Vested shares',
  unvested: 'Unvested shares',
  ofPackage: (pct: string) => `${pct} of their package`,
  founderTotalBefore: 'Founder’s total:',
  founderTotalAfter: 'of the company',
  leaverType: 'Type of exit',
  goodExamples: '**Good leaver**: for example illness, dismissal without just cause, an agreed departure.',
  goodText: (vested: string, unvested: string) =>
    `They generally keep their vested shares (${vested} of the company). The unvested shares (${unvested}) go back to the company or the other shareholders, usually through a buy-back at nominal or market value, as set out in the agreements.`,
  badExamples:
    '**Bad leaver**: for example resigning before an agreed date, breaching the non-compete covenant, dismissal for just cause.',
  badText: (vested: string, unvested: string) =>
    `The unvested shares (${unvested}) go back to the company or the other shareholders. On top of that, the agreements may provide that they also lose some or all of their vested shares (${vested}), or must sell them at a penalising price (for example at nominal value).`,
  leaverNote:
    'These are typical contractual options, not rules of law: they need to be set out in the founders’ agreement. In an Italian S.r.l. vesting is usually implemented through shareholders’ agreements (patti parasociali), call options or provisions in the articles of association.',
  exampleEyebrow: 'Quick example',
  exampleTitle: '4-year vesting, 1-year cliff',
  exampleLead: 'The founder holds 25% of the company, vesting month by month over 48 months.',
  examples: [
    { label: 'Leaves at 11 months', value: '0%', note: 'the cliff hasn’t passed yet' },
    { label: 'Leaves at 12 months', value: '25%', note: 'of their package, i.e. 6.25% of the company' },
    { label: 'Leaves at 30 months', value: '62.5%', note: 'of their package, i.e. 15.63% of the company' },
  ],
  whyTitle: 'Why vesting works for everyone',
  whyText1:
    'Shares allocated at incorporation reward work that is still largely to be done. With vesting, the people who stay don’t end up sharing the company with someone who stopped contributing, and newcomers know their commitment will be recognised over time.',
  whyText2:
    'Investors usually see it favourably: it shows the team has thought about its future. If you haven’t decided how to split the equity yet, start with the [calculator](@equity).',
  ctaTitle: 'Want to put vesting in writing?',
  ctaText:
    'A lawyer at ilTuoAvvocato.com can help you draft vesting and good/bad leaver clauses suited to your S.r.l.',
  chart: {
    aria: (cliff: number, duration: number, exit: number, pct: string) =>
      `Vesting chart: 0% until month ${cliff}, then rising to 100% at month ${duration}. Exit at month ${exit}: ${pct} of the package vested.`,
    cliff: (m: number) => `Cliff · month ${m}`,
    markerShort: (m: number, pct: string) => `Month ${m}: ${pct}`,
    markerLong: (m: number, pct: string) => `Leaves in month ${m}: ${pct}`,
    drag: 'Drag on the chart to move the exit',
  },
};

export default { it, en };
