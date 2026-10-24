// Milestone 8: empty states, the double opt-in explainer, toasts and keyboard hints (matching pages).
const it = {
  consent: {
    title: 'Come funziona il doppio consenso',
    lead: 'Nessuno riceve i tuoi contatti senza un sì da entrambe le parti.',
    steps: [
      { title: 'La startup propone', text: 'L’investitore vede solo un teaser anonimo: settore, fase, regione e round. Nessun nome.' },
      { title: 'L’investitore risponde', text: 'Se gli interessa, la startup vede chi è e decide. Un no non viene mai comunicato.' },
      { title: 'Sì da entrambi: intro', text: 'Solo allora arriva l’intro via email, con i nomi di tutte e due le parti.' },
    ],
    link: 'Prova il simulatore',
  },
  noMatches: {
    title: 'Nessun match, per ora',
    leadThesis: 'Nessuna startup di esempio supera tutti i criteri della tua tesi. Ecco le più vicine e cosa le esclude.',
    leadProfile:
      'Nessun investitore di esempio supera tutti i filtri per questo profilo. Ecco i più vicini e cosa li esclude: settore, fase e regione descrivono la tua startup, quindi qui puoi cambiare solo il round.',
    closest: 'I più vicini',
    relaxTitle: 'Cosa allargare',
    filter: { settore: 'settori', fase: 'fasi', area: 'aree', ticket: 'ticket minimo' },
    relaxThesis: (what: string, n: number) =>
      `Allargando ${what} ${n === 1 ? 'entra 1 startup' : `entrano ${n} startup`}.`,
    relaxProfile: (round: string, n: number) =>
      `Con un round di ${round} ${n === 1 ? 'entra 1 investitore' : `entrano ${n} investitori`} (il loro ticket minimo è più alto del tuo round).`,
    relaxButton: 'Allarga criteri',
    relaxButtonProfile: (round: string) => `Porta il round a ${round}`,
    noRelax: 'Nessuna modifica singola basta: prova a cambiare il profilo a mano.',
    edit: 'Modifica a mano',
    relaxed: (n: number) => `Criteri allargati: ${n === 1 ? '1 nuovo match' : `${n} nuovi match`}.`,
  },
  toast: {
    proposed: 'Proposta inviata – in attesa del consenso',
    sentTo: (name: string, left: number) =>
      `${name}. ${left === 1 ? 'Resta 1 proposta' : `Restano ${left} proposte`} questo mese.`,
    close: 'Chiudi il messaggio',
  },
  inboxEmpty: {
    pending: 'Niente in attesa: quando proponi il profilo, la richiesta compare qui finché l’investitore non risponde.',
    accepted: 'Ancora nessuna intro. Arriva qui quando tutte e due le parti dicono sì.',
    expired: (days: number) => `Nessuna richiesta scaduta. Dopo ${days} giorni senza risposta una richiesta finisce qui (valore provvisorio).`,
    investorTitle: 'Nessuna proposta da valutare',
    investorText: 'Quando una startup ti propone il suo profilo, qui vedi il teaser anonimo e decidi se ti interessa.',
  },
  agentRestored: 'Conversazione ripristinata: riprendi da dove eri rimasto.',
  deckNoFindings: {
    title: 'Nel deck non abbiamo trovato dati utili',
    text: 'Il PDF è stato letto, ma nessuna frase indica con sicurezza settore, fase, round o regione. Nessun problema: completa i dati a mano.',
  },
  directoryNoProfile: {
    title: 'Vuoi vedere l’affinità?',
    text: 'Crea il profilo della startup e la directory ordina gli investitori per affinità con te.',
  },
  slashHint: 'Premi / per cercare',
  slashHintSr: 'Scorciatoia: premi barra per andare alla ricerca.',
};

const en: typeof it = {
  consent: {
    title: 'How the double opt-in works',
    lead: 'Nobody gets your contact details without a yes from both sides.',
    steps: [
      { title: 'The startup proposes', text: 'The investor sees only an anonymous teaser: sector, stage, region and round. No names.' },
      { title: 'The investor answers', text: 'If interested, the startup sees who it is and decides. A no is never passed on.' },
      { title: 'Yes from both: intro', text: 'Only then does the intro email go out, with both names.' },
    ],
    link: 'Try the simulator',
  },
  noMatches: {
    title: 'No matches yet',
    leadThesis: 'No sample startup passes every criterion of your thesis. Here are the closest ones and what rules them out.',
    leadProfile:
      'No sample investor passes every filter for this profile. Here are the closest ones and what rules them out: sector, stage and region describe your startup, so the round is the only thing to change here.',
    closest: 'Closest ones',
    relaxTitle: 'What to widen',
    filter: { settore: 'sectors', fase: 'stages', area: 'areas', ticket: 'minimum ticket' },
    relaxThesis: (what: string, n: number) => `Widening ${what} brings in ${n === 1 ? '1 startup' : `${n} startups`}.`,
    relaxProfile: (round: string, n: number) =>
      `With a ${round} round, ${n === 1 ? '1 investor comes' : `${n} investors come`} in (their minimum ticket is above your round).`,
    relaxButton: 'Widen criteria',
    relaxButtonProfile: (round: string) => `Set the round to ${round}`,
    noRelax: 'No single change is enough: try editing the profile by hand.',
    edit: 'Edit by hand',
    relaxed: (n: number) => `Criteria widened: ${n === 1 ? '1 new match' : `${n} new matches`}.`,
  },
  toast: {
    proposed: 'Proposal sent – waiting for consent',
    sentTo: (name: string, left: number) => `${name}. ${left === 1 ? '1 proposal' : `${left} proposals`} left this month.`,
    close: 'Dismiss the message',
  },
  inboxEmpty: {
    pending: 'Nothing waiting: when you propose your profile, the request shows here until the investor answers.',
    accepted: 'No intros yet. They land here when both sides say yes.',
    expired: (days: number) => `No expired requests. After ${days} days without an answer a request ends up here (placeholder value).`,
    investorTitle: 'No proposals to review',
    investorText: 'When a startup proposes its profile to you, you see the anonymous teaser here and decide if you’re interested.',
  },
  agentRestored: 'Conversation restored: pick up where you left off.',
  deckNoFindings: {
    title: 'We found nothing usable in the deck',
    text: 'The PDF was read, but no sentence clearly states the sector, stage, round or region. No problem: fill in the details by hand.',
  },
  directoryNoProfile: {
    title: 'Want to see the fit?',
    text: 'Create your startup profile and the directory sorts investors by how well they fit you.',
  },
  slashHint: 'Press / to search',
  slashHintSr: 'Shortcut: press slash to jump to search.',
};

export default { it, en };
