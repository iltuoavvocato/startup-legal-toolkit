const it = {
  disclaimer: 'Strumento indicativo: non sostituisce una consulenza legale.',
  skipLink: 'Vai al contenuto',
  brandLabel: 'Startup Legal Toolkit — home',
  menuOpen: 'Apri il menu',
  menuClose: 'Chiudi il menu',
  navLabel: 'Principale',
  footerNavLabel: 'Footer',
  nav: {
    equity: 'Ripartizione quote',
    vesting: 'Vesting',
    quiz: 'Quali documenti?',
    match: 'Investitori',
  },
  talkToLawyer: 'Parla con un avvocato',
  footerTagline: 'Strumenti gratuiti per founder, a cura di ilTuoAvvocato.com',
  privacy: 'Privacy',
  newTab: ' (si apre in una nuova scheda)',
  copied: 'Copiato!',
  copiedStatus: 'Testo copiato negli appunti.',
  copyError: 'Copia non riuscita: seleziona e copia il testo manualmente.',
  lang: {
    label: 'Lingua',
    it: 'Italiano',
    en: 'English',
  },
  notFound: {
    eyebrow: 'Errore 404',
    title: 'Pagina *non trovata*',
    lead: 'La pagina che cerchi non esiste o è stata spostata.',
    home: 'Torna alla home',
    quiz: 'Fai il quiz',
  },
  toolLabel: (n: number, total: number) => `Strumento ${n} di ${total}`,
};

export type CommonMessages = typeof it;

const en: CommonMessages = {
  disclaimer: 'Indicative tool: not a substitute for legal advice.',
  skipLink: 'Skip to content',
  brandLabel: 'Startup Legal Toolkit — home',
  menuOpen: 'Open menu',
  menuClose: 'Close menu',
  navLabel: 'Main',
  footerNavLabel: 'Footer',
  nav: {
    equity: 'Equity split',
    vesting: 'Vesting',
    quiz: 'Which documents?',
    match: 'Investors',
  },
  talkToLawyer: 'Talk to a lawyer',
  footerTagline: 'Free tools for founders, by ilTuoAvvocato.com',
  privacy: 'Privacy',
  newTab: ' (opens in a new tab)',
  copied: 'Copied!',
  copiedStatus: 'Text copied to the clipboard.',
  copyError: 'Copy failed: select the text and copy it manually.',
  lang: {
    label: 'Language',
    it: 'Italiano',
    en: 'English',
  },
  notFound: {
    eyebrow: 'Error 404',
    title: 'Page *not found*',
    lead: 'The page you are looking for does not exist or has been moved.',
    home: 'Back to home',
    quiz: 'Take the quiz',
  },
  toolLabel: (n: number, total: number) => `Tool ${n} of ${total}`,
};

export default { it, en };
