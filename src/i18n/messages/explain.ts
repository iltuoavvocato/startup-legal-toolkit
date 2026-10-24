// Milestone 11: "Come funziona il matching" / "How matching works" and the "Perché questo match?" breakdown.
// Every number comes in as a parameter (from matching.ts / matchConfig.ts), never written into the copy.
const it = {
  link: 'Come funziona il matching',
  eyebrow: 'Match investitori · prototipo',
  title: 'Come funziona il matching',
  lead: 'Cosa confronta l’agente, come nasce il punteggio e cosa succede dopo. Regole semplici, uguali per tutti, scritte qui per intero: nessuna valutazione della startup e nessun consiglio di investimento.',
  fictional: 'Nomi e dati degli esempi sono fittizi.',
  filtersTitle: '1. Prima i filtri: sì o no',
  filtersLead:
    'Un abbinamento compare tra i risultati solo se supera tutti e quattro i filtri. Se ne manca anche uno, resta fuori, e vedi il motivo nell’elenco “esclusi”.',
  filters: {
    fase: 'Fase: la fase della startup è tra quelle in cui l’investitore entra.',
    settore: 'Settore: il settore della startup è tra quelli dell’investitore (un generalista li accetta tutti).',
    area: 'Area: la regione della startup è in una delle macro-aree dell’investitore (o l’investitore investe in tutta Italia).',
    ticket: 'Ticket: il ticket minimo dell’investitore non supera il round cercato.',
  },
  scoreTitle: '2. Poi il punteggio: da 0 a 100',
  scoreLead: 'Chi passa i filtri riceve un punteggio, somma di quattro parti. Questa tabella è generata dai valori usati dal codice:',
  shownTitle: '3. Come viene mostrato',
  shown: (bands: string) =>
    `Ogni risultato mostra il punteggio su 100, una barra e una fascia: ${bands}. Sotto, quattro frasi spiegano da dove viene. Il punteggio misura solo quanto i criteri dichiarati si sovrappongono: non dice nulla sulla qualità della startup o dell’investitore.`,
  tieBreak: 'A parità di punteggio viene prima chi copre una parte maggiore del round, poi chi ha più punti di settore, poi l’ordine alfabetico.',
  nearTitle: '4. Nessun match? I “più vicini” e “Allarga criteri”',
  near: [
    'Se nessuno passa tutti i filtri, l’agente mostra i più vicini: gli esclusi a cui manca il minor numero di filtri, con il motivo.',
    'Poi prova una sola modifica alla volta e conta davvero quanti nuovi match porterebbe. Per un investitore può allargare settori, fasi, aree o abbassare il ticket minimo (“Allarga criteri”). Per una startup cambia solo il round, perché settore, fase e regione descrivono l’azienda e non si “allargano”.',
    'Nulla cambia da solo: la modifica si applica solo se premi il pulsante, e puoi tornare indietro con “Modifica a mano”.',
  ],
  consentTitle: '5. Dopo il match: doppio consenso',
  rules: {
    title: 'Regole del prototipo',
    cap: (n: number) => `Una startup può proporre il proprio profilo a ${n} investitori al mese (limite indicativo).`,
    expiry: (days: number) =>
      `Una richiesta senza risposta scade dopo ${days} giorni. Scade anche se l’altra parte ha detto no: chi ha chiesto non lo saprà mai.`,
    placeholder: 'Pesi, soglie, limite e scadenza sono valori provvisori, da confermare prima di un eventuale lancio.',
  },
  notTitle: 'Cosa il matching non fa',
  not: [
    'Non gestisce denaro, ordini o sottoscrizioni e non prende commissioni sul round.',
    'Non dà consigli di investimento e non giudica la startup: confronta solo criteri dichiarati.',
    'Non pubblica pitch o profili: l’investitore vede un teaser anonimo finché la startup non accetta.',
    'Non invia nulla: in questa demo nessuna email parte e nessun dato lascia il browser.',
    'Non promette risultati: un punteggio alto non significa che l’investitore dirà sì.',
  ],
  example: {
    title: 'Prova: perché questo match?',
    lead: 'Una startup di esempio e un investitore di esempio, valutati con la stessa funzione dei risultati. Cambia i dati della startup e guarda come si muove ogni parte.',
    investor: 'Investitore di esempio',
    investorMeta: (tipo: string, settori: string, fasi: string, ticket: string, aree: string) =>
      `${tipo} · settori ${settori} · fasi ${fasi} · ticket ${ticket} · ${aree}`,
    startup: 'La startup di esempio',
    settore: 'Settore',
    fase: 'Fase',
    regione: 'Regione',
    round: 'Round cercato',
    reset: 'Ripristina l’esempio',
  },
  breakdown: {
    caption: 'Punti per ciascun criterio',
    head: { part: 'Criterio', points: 'Punti', why: 'Perché' },
    points: (points: string, max: number) => `${points} su ${max}`,
    settore: {
      principale: (s: string) => `${s} è il settore principale dell’investitore.`,
      secondario: (s: string) => `${s} è tra i settori dell’investitore, non il principale.`,
      generalista: () => 'Investitore generalista: accetta tutti i settori, con un punteggio intermedio.',
      nessuno: (s: string) => `${s} non è tra i settori dell’investitore.`,
    },
    ticket: {
      pieno: (pct: string, lead: string) => `Il ticket massimo copre il ${pct} del round: da ${lead} in su il punteggio è pieno.`,
      parziale: (pct: string, lead: string) =>
        `Il ticket massimo copre il ${pct} del round: punti in proporzione, pieni da ${lead} in su.`,
      nessuno: () => 'Il ticket non copre il round.',
      excluded: (min: string, round: string) => `Il ticket minimo (${min}) supera il round (${round}).`,
    },
    fase: {
      principale: (f: string) => `${f} è la fase principale dell’investitore.`,
      secondario: (f: string) => `${f} è tra le fasi dell’investitore, non la principale.`,
      nessuno: (f: string) => `L’investitore non entra in fase ${f}.`,
    },
    area: {
      stessaRegione: (r: string) => `L’investitore ha sede in ${r}, la stessa regione.`,
      area: (a: string) => `Stessa macro-area (${a}), regione diversa.`,
      italia: () => 'L’investitore investe in tutta Italia.',
      nessuno: (a: string) => `L’investitore non investe in ${a}.`,
    },
    filterOut: 'escluso dal filtro',
    total: 'Totale',
    totalValue: (score: number, band: string) => `${score} su 100 · ${band}`,
    rounded: 'Il totale è arrotondato all’intero.',
    excluded: 'Escluso: almeno un filtro non è superato, quindi il punteggio non viene calcolato e il match non compare.',
  },
  why: 'Perché questo match?',
};

export type ExplainMessages = typeof it;

const en: ExplainMessages = {
  link: 'How matching works',
  eyebrow: 'Investor matching · prototype',
  title: 'How matching works',
  lead: 'What the agent compares, how the score is built and what happens next. Simple rules, the same for everyone, set out here in full: no assessment of the startup and no investment advice.',
  fictional: 'Names and data in the examples are fictional.',
  filtersTitle: '1. Filters first: yes or no',
  filtersLead:
    'A pair only appears in the results if it passes all four filters. If even one fails, it is left out, and you can see why in the “excluded” list.',
  filters: {
    fase: 'Stage: the startup’s stage is one the investor invests at.',
    settore: 'Sector: the startup’s sector is one of the investor’s (a generalist accepts them all).',
    area: 'Area: the startup’s region is in one of the investor’s macro-areas (or the investor invests across Italy).',
    ticket: 'Ticket: the investor’s minimum ticket is no higher than the round being raised.',
  },
  scoreTitle: '2. Then the score: 0 to 100',
  scoreLead: 'Pairs that pass the filters get a score, the sum of four parts. This table is generated from the values the code uses:',
  shownTitle: '3. How it is shown',
  shown: (bands: string) =>
    `Each result shows the score out of 100, a bar and a band: ${bands}. Below it, four sentences explain where it comes from. The score only measures how far the stated criteria overlap: it says nothing about the quality of the startup or the investor.`,
  tieBreak: 'Ties are broken by how much of the round the investor covers, then by sector points, then alphabetically.',
  nearTitle: '4. No matches? “Closest ones” and “Widen criteria”',
  near: [
    'If nobody passes every filter, the agent shows the closest ones: the excluded entries that miss the fewest filters, with the reason.',
    'It then tries one change at a time and counts how many new matches each would really bring. For an investor it can widen sectors, stages or areas, or lower the minimum ticket (“Widen criteria”). For a startup it only changes the round, because sector, stage and region describe the company and can’t be “widened”.',
    'Nothing changes by itself: the change is applied only when you press the button, and you can go back with “Edit by hand”.',
  ],
  consentTitle: '5. After the match: double opt-in',
  rules: {
    title: 'Prototype rules',
    cap: (n: number) => `A startup can propose its profile to ${n} investors a month (indicative limit).`,
    expiry: (days: number) =>
      `A request with no answer expires after ${days} days. It also expires if the other side said no: whoever asked will never know.`,
    placeholder: 'Weights, thresholds, the limit and the expiry are placeholder values, to be confirmed before any launch.',
  },
  notTitle: 'What matching does not do',
  not: [
    'It doesn’t handle money, orders or subscriptions, and takes no fee on the round.',
    'It gives no investment advice and doesn’t judge the startup: it only compares stated criteria.',
    'It publishes no pitches or profiles: the investor sees an anonymous teaser until the startup accepts.',
    'It sends nothing: in this demo no email goes out and no data leaves your browser.',
    'It promises no results: a high score doesn’t mean the investor will say yes.',
  ],
  example: {
    title: 'Try it: why this match?',
    lead: 'A sample startup and a sample investor, scored with the same function as the results. Change the startup’s details and watch each part move.',
    investor: 'Sample investor',
    investorMeta: (tipo: string, settori: string, fasi: string, ticket: string, aree: string) =>
      `${tipo} · sectors ${settori} · stages ${fasi} · ticket ${ticket} · ${aree}`,
    startup: 'The sample startup',
    settore: 'Sector',
    fase: 'Stage',
    regione: 'Region',
    round: 'Round being raised',
    reset: 'Reset the example',
  },
  breakdown: {
    caption: 'Points for each criterion',
    head: { part: 'Criterion', points: 'Points', why: 'Why' },
    points: (points: string, max: number) => `${points} of ${max}`,
    settore: {
      principale: (s: string) => `${s} is the investor’s main sector.`,
      secondario: (s: string) => `${s} is one of the investor’s sectors, not the main one.`,
      generalista: () => 'Generalist investor: accepts every sector, with a middle score.',
      nessuno: (s: string) => `${s} is not one of the investor’s sectors.`,
    },
    ticket: {
      pieno: (pct: string, lead: string) => `The maximum ticket covers ${pct} of the round: from ${lead} upwards, full points.`,
      parziale: (pct: string, lead: string) =>
        `The maximum ticket covers ${pct} of the round: points in proportion, full from ${lead} upwards.`,
      nessuno: () => 'The ticket doesn’t cover the round.',
      excluded: (min: string, round: string) => `The minimum ticket (${min}) is above the round (${round}).`,
    },
    fase: {
      principale: (f: string) => `${f} is the investor’s main stage.`,
      secondario: (f: string) => `${f} is one of the investor’s stages, not the main one.`,
      nessuno: (f: string) => `The investor doesn’t invest at ${f} stage.`,
    },
    area: {
      stessaRegione: (r: string) => `The investor is based in ${r}, the same region.`,
      area: (a: string) => `Same macro-area (${a}), different region.`,
      italia: () => 'The investor invests across Italy.',
      nessuno: (a: string) => `The investor doesn’t invest in ${a}.`,
    },
    filterOut: 'excluded by the filter',
    total: 'Total',
    totalValue: (score: number, band: string) => `${score} out of 100 · ${band}`,
    rounded: 'The total is rounded to the nearest whole number.',
    excluded: 'Excluded: at least one filter fails, so no score is calculated and the match doesn’t appear.',
  },
  why: 'Why this match?',
};

export default { it, en };
