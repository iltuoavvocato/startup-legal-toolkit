const it = {
  eyebrow: 'Informazioni',
  title: 'Privacy',
  lead: 'In breve: questo sito non raccoglie i tuoi dati.',
  cookiesTitle: 'Nessun cookie, nessun tracciamento',
  cookiesText: 'Questo sito non usa cookie, strumenti di analisi, pixel o altri sistemi di tracciamento.',
  storageTitle: 'L’unica cosa salvata: la lingua',
  storageText:
    'Se usi il selettore di lingua (IT/EN), il sito ricorda la tua scelta nel localStorage del browser, con la chiave “lang” e il valore “it” o “en”. Non contiene altri dati, non viene inviata a nessuno e serve solo a portarti alla versione inglese quando apri la home italiana. Se non usi il selettore non viene salvato nulla, e puoi cancellare la preferenza dalle impostazioni del browser.',
  localTitle: 'I calcoli restano sul tuo dispositivo',
  localText:
    'Tutti i calcoli (ripartizione quote, vesting e quiz) avvengono nel tuo browser. Nessun dato che inserisci viene inviato a server, a ilTuoAvvocato.com o a terzi. Il sito non effettua richieste esterne: anche i caratteri tipografici sono serviti dallo stesso sito.',
  urlText:
    'Per rendere i risultati condivisibili, alcuni strumenti riportano i valori inseriti nell’indirizzo della pagina (la parte dopo il “?”). Non vengono inviati a nessuno: escono dal tuo dispositivo solo se sei tu a condividere il link.',
  linksTitle: 'Link esterni',
  linksBefore: 'I pulsanti “Parla con un avvocato” portano a',
  linksAfter:
    ', che ha una propria informativa privacy. Il link contiene solo parametri che indicano da quale strumento arrivi (per esempio “utm_campaign=quiz”), non i dati che hai inserito.',
  whoTitle: 'Chi gestisce il sito',
  whoText: 'Startup Legal Toolkit è un servizio di ilTuoAvvocato.com, servizi legali online con avvocati iscritti all’Ordine.',
};

export type PrivacyMessages = typeof it;

const en: PrivacyMessages = {
  eyebrow: 'Information',
  title: 'Privacy',
  lead: 'In short: this site does not collect your data.',
  cookiesTitle: 'No cookies, no tracking',
  cookiesText: 'This site does not use cookies, analytics, pixels or any other tracking.',
  storageTitle: 'The only thing stored: your language',
  storageText:
    'If you use the language switcher (IT/EN), the site remembers your choice in your browser’s localStorage, under the key “lang” with the value “it” or “en”. It holds no other data, is never sent anywhere and is only used to take you to the English version when you open the Italian home page. If you don’t use the switcher, nothing is stored, and you can clear the preference in your browser settings.',
  localTitle: 'Calculations stay on your device',
  localText:
    'All calculations (equity split, vesting and quiz) run in your browser. Nothing you enter is sent to a server, to ilTuoAvvocato.com or to third parties. The site makes no external requests: even the fonts are served by the site itself.',
  urlText:
    'To make results shareable, some tools put the values you enter in the page address (the part after the “?”). They are not sent to anyone: they only leave your device if you share the link yourself.',
  linksTitle: 'External links',
  linksBefore: 'The “Talk to a lawyer” buttons lead to',
  linksAfter:
    ', which has its own privacy policy (in Italian). The link only contains parameters showing which tool you came from (for example “utm_campaign=quiz”), not the data you entered.',
  whoTitle: 'Who runs the site',
  whoText:
    'Startup Legal Toolkit is a service of ilTuoAvvocato.com, online legal services with lawyers registered with the Italian Bar.',
};

export default { it, en };
