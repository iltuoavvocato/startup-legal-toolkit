const it = {
  title: 'Calcolatore *ripartizione quote*',
  lead: 'Dai un peso a ciò che ciascun cofondatore porta nel progetto e ottieni una ripartizione indicativa delle quote. Un punto di partenza concreto per parlarne tra soci.',
  factors: {
    idea: 'Idea e visione',
    tempo: 'Tempo e impegno',
    capitale: 'Capitale investito',
    competenze: 'Competenze chiave',
    ruolo: 'Ruolo e responsabilità',
  },
  weightsTitle: '1. Quanto conta ogni fattore',
  weightsIntro: 'Regola l’importanza di ciascun fattore. I pesi vengono normalizzati automaticamente al 100%.',
  excluded: 'escluso',
  foundersTitle: '2. Chi porta cosa',
  partners: (n: number) => `${n} ${n === 1 ? 'socio' : 'soci'}`,
  foundersIntro:
    'Per idea, competenze e ruolo usa un punteggio da 0 a 10. Tempo e capitale contano in proporzione al totale del gruppo.',
  founderNameLabel: (n: number) => `Nome del cofondatore ${n}`,
  remove: (name: string) => `Rimuovi ${name}`,
  addFounder: 'Aggiungi cofondatore',
  maxFounders: (n: number) => `Massimo ${n} cofondatori.`,
  poolTitle: '3. Riserva per pool / ESOP (facoltativa)',
  poolIntro:
    'Puoi accantonare una parte delle quote per futuri collaboratori chiave. La riserva riduce in proporzione la quota di tutti i fondatori.',
  poolLabel: 'Riserva pool / ESOP',
  resultTitle: 'Ripartizione indicativa',
  donutCenter: 'cofondatori',
  donutAria: (parts: string) => `Grafico a ciambella: ${parts}`,
  total: 'Totale',
  fallbackEqual: 'Non ci sono ancora valori da confrontare: per ora la ripartizione è in parti uguali.',
  excludedNotice: (labels: string, count: number) =>
    `Nessuno ha inserito valori per ${labels}: ${count === 1 ? 'il fattore è escluso' : 'i fattori sono esclusi'} e i pesi degli altri vengono ridistribuiti.`,
  copySummary: 'Copia riepilogo',
  print: 'Stampa / salva PDF',
  reset: 'Ripristina',
  formulaTitle: 'Come calcoliamo',
  formulaAria:
    'quota di i uguale alla somma sui fattori f di peso f per punteggio di i su f diviso la somma dei punteggi di tutti su f',
  formulaWords: { share: 'quota', weight: 'peso', score: 'punteggio' },
  formulaText:
    'Per ogni fattore, ciascuno riceve una parte del peso in proporzione a quanto ha portato rispetto al totale del gruppo. I pesi sono normalizzati al 100%. Se per un fattore il totale è zero (per esempio nessuno mette capitale), quel fattore viene escluso e i pesi degli altri sono ricalcolati. Le percentuali sono arrotondate a un decimale con il metodo dei resti più alti, così il totale fa sempre 100,0%.',
  breakdown: 'Dettaglio per fattore',
  breakdownCaption: 'Contributo di ciascun fattore alla quota di ogni cofondatore, prima della riserva pool',
  breakdownHead: 'Fattore (peso)',
  result: 'Risultato',
  notesTitle: 'Prima di firmare',
  notes: [
    {
      title: 'È un punto di partenza',
      text: 'Il risultato serve ad aprire la discussione, non a chiuderla. Pesi e punteggi sono soggettivi: confrontateli apertamente e rivedeteli insieme.',
    },
    {
      title: 'Abbinalo al vesting',
      text: 'Le quote premiano un impegno che in gran parte deve ancora arrivare. Con il vesting maturano un po’ alla volta. [Prova il simulatore](@vesting).',
    },
    {
      title: 'Mettilo per iscritto',
      text: 'La ripartizione concordata, i ruoli e le regole di uscita andrebbero scritti nei patti tra fondatori, adattati alla vostra società.',
    },
  ],
  ctaTitle: 'Vuoi trasformare la ripartizione in un accordo?',
  ctaText: 'Un avvocato di ilTuoAvvocato.com può aiutarti a scrivere i patti tra fondatori e le clausole di vesting.',
  summary: {
    heading: 'Ripartizione quote indicativa — Startup Legal Toolkit (ilTuoAvvocato.com)',
    weights: 'Pesi dei fattori usati:',
    excluded: (labels: string) => `Fattori esclusi (nessun valore inserito): ${labels}.`,
    values: 'Valori inseriti:',
    formula: 'Formula: quota_i = Σ_f peso_f × (punteggio_i,f / Σ_j punteggio_j,f)',
  },
};

export type EquityMessages = typeof it;

const en: EquityMessages = {
  title: 'Equity *split calculator*',
  lead: 'Weigh what each co-founder brings to the project and get an indicative split of the shares. A concrete starting point for the conversation between co-founders.',
  factors: {
    idea: 'Idea and vision',
    tempo: 'Time and commitment',
    capitale: 'Capital invested',
    competenze: 'Key skills',
    ruolo: 'Role and responsibilities',
  },
  weightsTitle: '1. How much each factor counts',
  weightsIntro: 'Set how important each factor is. Weights are automatically normalised to 100%.',
  excluded: 'excluded',
  foundersTitle: '2. Who brings what',
  partners: (n: number) => `${n} ${n === 1 ? 'co-founder' : 'co-founders'}`,
  foundersIntro:
    'For idea, skills and role use a score from 0 to 10. Time and capital count in proportion to the group’s total.',
  founderNameLabel: (n: number) => `Name of co-founder ${n}`,
  remove: (name: string) => `Remove ${name}`,
  addFounder: 'Add co-founder',
  maxFounders: (n: number) => `Up to ${n} co-founders.`,
  poolTitle: '3. Pool / ESOP reserve (optional)',
  poolIntro:
    'You can set aside part of the equity for future key team members. The reserve reduces every founder’s share proportionally.',
  poolLabel: 'Pool / ESOP reserve',
  resultTitle: 'Indicative split',
  donutCenter: 'co-founders',
  donutAria: (parts: string) => `Donut chart: ${parts}`,
  total: 'Total',
  fallbackEqual: 'There are no values to compare yet: for now the split is equal.',
  excludedNotice: (labels: string, count: number) =>
    `Nobody has entered values for ${labels}: ${count === 1 ? 'the factor is excluded' : 'the factors are excluded'} and the other weights are redistributed.`,
  copySummary: 'Copy summary',
  print: 'Print / save as PDF',
  reset: 'Reset',
  formulaTitle: 'How we calculate it',
  formulaAria:
    'share of i equals the sum over factors f of weight f times the score of i on f divided by the sum of everyone’s scores on f',
  formulaWords: { share: 'share', weight: 'weight', score: 'score' },
  formulaText:
    'For each factor, everyone gets part of its weight in proportion to what they brought compared with the group’s total. Weights are normalised to 100%. If a factor’s total is zero (for example nobody puts in capital), that factor is excluded and the other weights are recalculated. Percentages are rounded to one decimal place with the largest remainder method, so the total is always 100.0%.',
  breakdown: 'Breakdown by factor',
  breakdownCaption: 'Contribution of each factor to each co-founder’s share, before the pool reserve',
  breakdownHead: 'Factor (weight)',
  result: 'Result',
  notesTitle: 'Before you sign',
  notes: [
    {
      title: 'It’s a starting point',
      text: 'The result is there to open the discussion, not to close it. Weights and scores are subjective: compare them openly and review them together.',
    },
    {
      title: 'Pair it with vesting',
      text: 'Equity rewards a commitment that is still largely to come. With vesting, shares are earned a little at a time. [Try the simulator](@vesting).',
    },
    {
      title: 'Put it in writing',
      text: 'The agreed split, roles and exit rules should be written into a founders’ agreement tailored to your company.',
    },
  ],
  ctaTitle: 'Want to turn the split into an agreement?',
  ctaText: 'A lawyer at ilTuoAvvocato.com can help you draft the founders’ agreement and vesting clauses.',
  summary: {
    heading: 'Indicative equity split — Startup Legal Toolkit (ilTuoAvvocato.com)',
    weights: 'Factor weights used:',
    excluded: (labels: string) => `Excluded factors (no values entered): ${labels}.`,
    values: 'Values entered:',
    formula: 'Formula: share_i = Σ_f weight_f × (score_i,f / Σ_j score_j,f)',
  },
};

export default { it, en };
